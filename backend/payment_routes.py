"""
Billplz payment gateway integration for Alif Amin Academy.
Handles bill creation, redirect verification, and webhook callbacks.
DB credentials first, .env fallback.
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import uuid
import os
import hmac
import hashlib
import httpx
import logging
import urllib.parse
from credentials import get_billplz_config

payment_router = APIRouter(prefix="/api/payments")
logger = logging.getLogger(__name__)

db = None

TOPUP_PACKAGES = {
    "pkg_100": {"price_myr": 100.00, "paid_credits": 8, "bonus_credits": 1, "name": "Starter Pack"},
    "pkg_300": {"price_myr": 300.00, "paid_credits": 24, "bonus_credits": 3, "name": "Value Pack"},
    "pkg_500": {"price_myr": 500.00, "paid_credits": 40, "bonus_credits": 6, "name": "Premium Pack"},
}


def init_payment_routes(database):
    global db
    db = database


def _billplz_base_url(sandbox: bool) -> str:
    return "https://www.billplz-sandbox.com/api/v3" if sandbox else "https://www.billplz.com/api/v3"


def _verify_x_signature(params: dict, x_sig_key: str, received_sig: str) -> bool:
    """Verify Billplz X-Signature using HMAC-SHA256."""
    filtered = {k: v for k, v in params.items() if k != "x_signature"}
    sorted_keys = sorted(filtered.keys())
    source = "|".join(f"{k}{filtered[k]}" for k in sorted_keys)
    expected = hmac.new(
        x_sig_key.encode("utf-8"),
        source.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, received_sig)


class CreateBillRequest(BaseModel):
    package_id: str


@payment_router.post("/billplz/create-bill")
async def create_billplz_bill(req: CreateBillRequest, request: Request):
    """Create a Billplz bill and return the payment URL."""
    # Auth check
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate package
    pkg = TOPUP_PACKAGES.get(req.package_id)
    if not pkg:
        raise HTTPException(status_code=400, detail="Invalid package")

    api_key, collection_id, x_sig_key, sandbox = await get_billplz_config()
    if not api_key or not collection_id:
        raise HTTPException(status_code=503, detail="Billplz not configured. Add BILLPLZ_API_KEY and BILLPLZ_COLLECTION_ID to settings.")

    # Build callback and redirect URLs
    base_url = os.environ.get("REACT_APP_BACKEND_URL", str(request.base_url).rstrip("/"))
    callback_url = f"{base_url}/api/payments/billplz/callback"
    redirect_url = f"{base_url}/api/payments/billplz/redirect"

    # Create a pending payment record
    payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
    student_id = student["student_id"] if student else user["user_id"]

    amount_cents = int(pkg["price_myr"] * 100)

    # Call Billplz API
    billplz_url = _billplz_base_url(sandbox)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{billplz_url}/bills",
                auth=(api_key, ""),
                data={
                    "collection_id": collection_id,
                    "email": user.get("email", ""),
                    "name": user.get("name", "Student"),
                    "amount": amount_cents,
                    "description": f"Alif Amin - {pkg['name']} ({pkg['paid_credits']} credits)",
                    "callback_url": callback_url,
                    "redirect_url": redirect_url,
                },
                timeout=15.0
            )
        if resp.status_code not in (200, 201):
            logger.error(f"Billplz bill creation failed: {resp.status_code} {resp.text}")
            raise HTTPException(status_code=502, detail="Billplz bill creation failed")
        bill = resp.json()
    except httpx.RequestError as e:
        logger.error(f"Billplz request error: {e}")
        raise HTTPException(status_code=502, detail="Could not connect to Billplz")

    # Store pending payment
    await db.pending_payments.insert_one({
        "payment_id": payment_id,
        "billplz_bill_id": bill["id"],
        "user_id": user["user_id"],
        "student_id": student_id,
        "package_id": req.package_id,
        "amount_myr": pkg["price_myr"],
        "paid_credits": pkg["paid_credits"],
        "bonus_credits": pkg["bonus_credits"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"bill_url": bill["url"], "bill_id": bill["id"], "payment_id": payment_id}


async def _credit_wallet(payment_doc: dict):
    """Credit the student's wallet after verified payment."""
    student_id = payment_doc["student_id"]
    paid = payment_doc["paid_credits"]
    bonus = payment_doc["bonus_credits"]

    wallet = await db.student_wallets.find_one({"student_id": student_id}, {"_id": 0})
    if not wallet:
        await db.student_wallets.insert_one({
            "student_id": student_id,
            "paid_credits": 0, "bonus_credits": 0, "credit_balance": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        wallet = {"paid_credits": 0, "bonus_credits": 0, "credit_balance": 0}

    new_paid = wallet.get("paid_credits", 0) + paid
    new_bonus = wallet.get("bonus_credits", 0) + bonus
    new_balance = new_paid + new_bonus
    await db.student_wallets.update_one(
        {"student_id": student_id},
        {"$set": {"paid_credits": new_paid, "bonus_credits": new_bonus, "credit_balance": new_balance}}
    )

    # Write transactions
    now = datetime.now(timezone.utc).isoformat()
    await db.wallet_transactions.insert_one({
        "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
        "student_id": student_id,
        "transaction_type": "topup_paid",
        "credit_amount": paid,
        "description": f"Billplz top-up - {payment_doc['package_id']} (RM{payment_doc['amount_myr']})",
        "created_at": now,
    })
    if bonus > 0:
        await db.wallet_transactions.insert_one({
            "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
            "student_id": student_id,
            "transaction_type": "topup_bonus",
            "credit_amount": bonus,
            "description": f"Bonus credits for {payment_doc['package_id']}",
            "created_at": now,
        })

    logger.info(f"Wallet credited: student={student_id} paid=+{paid} bonus=+{bonus}")


@payment_router.post("/billplz/callback")
async def billplz_callback(request: Request):
    """Billplz server-to-server webhook callback."""
    body = await request.body()
    params = dict(urllib.parse.parse_qsl(body.decode("utf-8")))

    bill_id = params.get("id", "")
    paid = params.get("paid", "false")
    x_sig = params.get("x_signature", "")

    logger.info(f"Billplz callback: bill_id={bill_id} paid={paid}")

    # Verify X-Signature if key is configured
    _, _, x_sig_key, _ = await get_billplz_config()
    if x_sig_key and x_sig:
        if not _verify_x_signature(params, x_sig_key, x_sig):
            logger.warning(f"Billplz callback X-Signature verification FAILED for bill {bill_id}")
            raise HTTPException(status_code=403, detail="Invalid signature")

    if paid == "true":
        payment = await db.pending_payments.find_one({"billplz_bill_id": bill_id}, {"_id": 0})
        if payment and payment["status"] == "pending":
            await _credit_wallet(payment)
            await db.pending_payments.update_one(
                {"billplz_bill_id": bill_id},
                {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )

    return {"status": "ok"}


@payment_router.get("/billplz/redirect")
async def billplz_redirect(request: Request):
    """Handle Billplz redirect after payment (user-facing)."""
    params = dict(request.query_params)
    # Billplz sends params as billplz[id], billplz[paid], etc.
    bill_id = params.get("billplz[id]", "")
    paid = params.get("billplz[paid]", "false")
    x_sig = params.get("billplz[x_signature]", "")

    logger.info(f"Billplz redirect: bill_id={bill_id} paid={paid}")

    # Verify X-Signature if available
    _, _, x_sig_key, _ = _get_billplz_config()
    if x_sig_key and x_sig:
        redirect_params = {}
        for k, v in params.items():
            clean_key = k.replace("billplz[", "").replace("]", "")
            redirect_params[clean_key] = v
        if not _verify_x_signature(redirect_params, x_sig_key, x_sig):
            logger.warning("Billplz redirect signature verification failed")

    # Also credit here in case callback hasn't fired yet
    if paid == "true":
        payment = await db.pending_payments.find_one({"billplz_bill_id": bill_id}, {"_id": 0})
        if payment and payment["status"] == "pending":
            await _credit_wallet(payment)
            await db.pending_payments.update_one(
                {"billplz_bill_id": bill_id},
                {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )

    # Redirect user back to the wallet page
    frontend_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    status = "success" if paid == "true" else "failed"
    return RedirectResponse(url=f"{frontend_url}/student/wallet?payment={status}", status_code=302)
