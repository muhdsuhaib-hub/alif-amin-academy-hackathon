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
    expected = hmac.HMAC(
        x_sig_key.encode("utf-8"),
        source.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, received_sig)


class CreateBillRequest(BaseModel):
    package_id: Optional[str] = None
    custom_credits: Optional[int] = None

CREDIT_RATE_MYR = 15  # RM 15 per credit


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

    # Resolve package or custom credits
    if req.custom_credits and req.custom_credits > 0:
        if req.custom_credits > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 credits per transaction")
        price_myr = req.custom_credits * CREDIT_RATE_MYR
        paid_credits = req.custom_credits
        bonus_credits = 0
        bill_description = f"Alif Amin - Custom Top Up ({paid_credits} credits)"
        pkg_id = f"custom_{paid_credits}"
    elif req.package_id:
        pkg = TOPUP_PACKAGES.get(req.package_id)
        if not pkg:
            raise HTTPException(status_code=400, detail="Invalid package")
        price_myr = pkg["price_myr"]
        paid_credits = pkg["paid_credits"]
        bonus_credits = pkg["bonus_credits"]
        bill_description = f"Alif Amin - {pkg['name']} ({paid_credits} credits)"
        pkg_id = req.package_id
    else:
        raise HTTPException(status_code=400, detail="Provide package_id or custom_credits")

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

    amount_cents = int(price_myr * 100)

    # Call Billplz API – always production
    billplz_url = "https://www.billplz.com/api/v3"
    clean_api_key = api_key.strip()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{billplz_url}/bills",
                auth=(clean_api_key, ""),
                data={
                    "collection_id": collection_id,
                    "email": user.get("email", ""),
                    "name": user.get("name", "Student"),
                    "amount": amount_cents,
                    "description": bill_description,
                    "callback_url": callback_url,
                    "redirect_url": redirect_url,
                },
                timeout=15.0
            )
        if resp.status_code not in (200, 201):
            # Parse exact Billplz error for debugging
            try:
                billplz_err = resp.json()
                err_msg = billplz_err.get("error", {}).get("message", []) if isinstance(billplz_err.get("error"), dict) else billplz_err.get("error", resp.text)
                if isinstance(err_msg, list):
                    err_msg = "; ".join(err_msg) if err_msg else resp.text
            except Exception:
                err_msg = resp.text
            logger.error(f"Billplz bill creation failed: {resp.status_code} {err_msg}")
            raise HTTPException(status_code=400, detail=f"Billplz API Error: {err_msg}")
        bill = resp.json()
    except HTTPException:
        raise
    except httpx.RequestError as e:
        logger.error(f"Billplz request error: {e}")
        raise HTTPException(status_code=502, detail=f"Could not connect to Billplz: {e}")

    # Store pending payment
    await db.pending_payments.insert_one({
        "payment_id": payment_id,
        "billplz_bill_id": bill["id"],
        "user_id": user["user_id"],
        "student_id": student_id,
        "package_id": pkg_id,
        "amount_myr": price_myr,
        "paid_credits": paid_credits,
        "bonus_credits": bonus_credits,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"bill_url": bill["url"], "bill_id": bill["id"], "payment_id": payment_id}


async def _credit_wallet(payment_doc: dict):
    """Credit the student's wallet after verified Billplz payment.
    Uses the same wallet schema and transaction helpers as wallet_routes.py
    to ensure consistency across admin reports and user-facing history.
    """
    from wallet_routes import get_or_create_wallet, add_transaction, create_bonus_credit_batch, BASE_CREDIT_PRICE

    student_id = payment_doc["student_id"]
    user_id = payment_doc["user_id"]
    paid = payment_doc["paid_credits"]
    bonus = payment_doc["bonus_credits"]
    amount_myr = payment_doc.get("amount_myr", 0)
    package_id = payment_doc.get("package_id", "unknown")
    payment_id = payment_doc.get("payment_id", "")

    try:
        wallet = await get_or_create_wallet(student_id, user_id)
        wallet_id = wallet["wallet_id"]

        new_paid = wallet.get("paid_credits", 0) + paid
        new_bonus = wallet.get("bonus_credits", 0) + bonus
        new_balance = new_paid + new_bonus
        new_total_topup = wallet.get("total_topup_amount", 0) + amount_myr
        new_total_paid = wallet.get("total_paid_credits_purchased", 0) + paid
        new_total_bonus = wallet.get("total_bonus_credits_received", 0) + bonus

        await db.student_wallets.update_one(
            {"wallet_id": wallet_id},
            {"$set": {
                "paid_credits": new_paid,
                "bonus_credits": new_bonus,
                "credit_balance": new_balance,
                "total_topup_amount": new_total_topup,
                "total_paid_credits_purchased": new_total_paid,
                "total_bonus_credits_received": new_total_bonus,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        logger.info(f"[Billplz] Wallet updated: student={student_id} wallet={wallet_id} paid=+{paid} bonus=+{bonus} balance={new_balance}")

        # Write paid-credit transaction
        await add_transaction(
            wallet_id=wallet_id,
            student_id=student_id,
            transaction_type="topup_paid",
            credit_amount=paid,
            description=f"Billplz Credit Top Up - {package_id} (RM{amount_myr})",
            monetary_value=paid * BASE_CREDIT_PRICE,
            payment_amount=amount_myr,
            reference_id=payment_id,
        )

        # Write bonus-credit transaction + expiry batch
        if bonus > 0:
            await add_transaction(
                wallet_id=wallet_id,
                student_id=student_id,
                transaction_type="topup_bonus",
                credit_amount=bonus,
                description=f"Bonus credits for {package_id}",
                monetary_value=bonus * BASE_CREDIT_PRICE,
                payment_amount=0,
                reference_id=payment_id,
            )
            await create_bonus_credit_batch(
                wallet_id=wallet_id,
                student_id=student_id,
                credit_amount=bonus,
                source="topup_bonus",
                reference_id=payment_id,
            )
            logger.info(f"[Billplz] Bonus batch created: student={student_id} bonus={bonus}")

    except Exception as e:
        logger.error(f"[Billplz] CRITICAL — wallet credit FAILED for student={student_id} payment={payment_id}: {e}", exc_info=True)
        raise


@payment_router.post("/billplz/callback")
async def billplz_callback(request: Request):
    """Billplz server-to-server webhook callback."""
    body = await request.body()
    params = dict(urllib.parse.parse_qsl(body.decode("utf-8")))

    bill_id = params.get("id", "")
    paid = params.get("paid", "false")
    collection_id = params.get("collection_id", "")
    x_sig = params.get("x_signature", "")

    logger.info(f"[Billplz Callback] Received: bill_id={bill_id} paid={paid} collection_id={collection_id} params={list(params.keys())}")

    # Verify X-Signature if key is configured
    _, _, x_sig_key, _ = await get_billplz_config()
    if x_sig_key and x_sig:
        if not _verify_x_signature(params, x_sig_key, x_sig):
            logger.warning(f"[Billplz Callback] X-Signature FAILED for bill {bill_id}")
            # Return 200 anyway so Billplz doesn't retry endlessly, but don't process
            return {"status": "signature_failed"}

    if paid == "true":
        payment = await db.pending_payments.find_one({"billplz_bill_id": bill_id}, {"_id": 0})
        if not payment:
            logger.warning(f"[Billplz Callback] No pending_payment found for bill_id={bill_id}")
        elif payment["status"] != "pending":
            logger.info(f"[Billplz Callback] Payment already processed (status={payment['status']}) for bill_id={bill_id} — skipping (idempotent)")
        else:
            try:
                await _credit_wallet(payment)
                await db.pending_payments.update_one(
                    {"billplz_bill_id": bill_id},
                    {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
                )
                logger.info(f"[Billplz Callback] SUCCESS — bill_id={bill_id} user={payment['user_id']} credits={payment['paid_credits']}+{payment['bonus_credits']} RM{payment['amount_myr']}")
            except Exception as e:
                logger.error(f"[Billplz Callback] FAILED to credit wallet for bill_id={bill_id}: {e}", exc_info=True)
    else:
        logger.info(f"[Billplz Callback] Bill {bill_id} not paid (state={paid})")

    return {"status": "ok"}


@payment_router.get("/billplz/redirect")
async def billplz_redirect(request: Request):
    """Handle Billplz redirect after payment (user-facing).
    MUST always return a RedirectResponse — never a raw error page.
    """
    frontend_url = os.environ.get("REACT_APP_BACKEND_URL", "")

    try:
        params = dict(request.query_params)
        bill_id = params.get("billplz[id]", "")
        paid = params.get("billplz[paid]", "false")
        x_sig = params.get("billplz[x_signature]", "")

        logger.info(f"[Billplz Redirect] bill_id={bill_id} paid={paid} params={list(params.keys())}")

        # Verify X-Signature if key is configured
        sig_valid = True
        try:
            _, _, x_sig_key, _ = await get_billplz_config()
            if x_sig_key and x_sig:
                redirect_params = {}
                for k, v in params.items():
                    clean_key = k.replace("billplz[", "").replace("]", "")
                    redirect_params[clean_key] = v
                if not _verify_x_signature(redirect_params, x_sig_key, x_sig):
                    sig_valid = False
                    logger.warning(f"[Billplz Redirect] X-Signature FAILED for bill {bill_id} — skipping wallet credit")
        except Exception as e:
            logger.error(f"[Billplz Redirect] Signature check error: {e}")
            sig_valid = False

        # Only credit wallet if signature is valid and payment is marked paid
        if paid == "true" and sig_valid:
            try:
                payment = await db.pending_payments.find_one({"billplz_bill_id": bill_id}, {"_id": 0})
                if not payment:
                    logger.warning(f"[Billplz Redirect] No pending_payment for bill_id={bill_id}")
                elif payment["status"] != "pending":
                    logger.info(f"[Billplz Redirect] Already processed (status={payment['status']}) for bill_id={bill_id}")
                else:
                    await _credit_wallet(payment)
                    await db.pending_payments.update_one(
                        {"billplz_bill_id": bill_id},
                        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    logger.info(f"[Billplz Redirect] Credited via redirect for bill_id={bill_id}")
            except Exception as e:
                logger.error(f"[Billplz Redirect] Wallet credit failed for bill_id={bill_id}: {e}", exc_info=True)
                # Don't block redirect — the server callback will handle it

        # Determine user-facing status: paid status from Billplz is the source of truth.
        # Signature failure only prevents wallet crediting here (the server callback handles it).
        status = "success" if paid == "true" else "failed"

    except Exception as e:
        logger.error(f"[Billplz Redirect] Unhandled error: {e}", exc_info=True)
        status = "failed"

    return RedirectResponse(url=f"{frontend_url}/student/dashboard?tab=wallet&payment={status}", status_code=302)
