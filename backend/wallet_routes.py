from fastapi import APIRouter, HTTPException, Request, Header
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid
import hmac
import hashlib
import json
import os

wallet_router = APIRouter(prefix="/api/wallet")

# Database will be injected from server.py
db = None

def init_wallet_routes(database):
    global db
    db = database


# ============== CREDIT SYSTEM CONSTANTS ==============
# Credit to minutes conversion
CREDITS_TO_MINUTES = {
    1: 15,   # 1 credit = 15 minutes
    2: 30,   # 2 credits = 30 minutes
    4: 60,   # 4 credits = 60 minutes
}

# Credit pricing (individual purchase)
CREDIT_PRICING = {
    1: 15.00,   # 1 credit = RM15
    2: 27.00,   # 2 credits = RM27
    4: 50.00,   # 4 credits = RM50
}

# Top-up packages
TOPUP_PACKAGES = [
    {
        "package_id": "pkg_100",
        "name": "Starter Pack",
        "price_myr": 100.00,
        "credits": 9,
        "bonus_credits": 0,
        "savings": "Save RM35",
        "popular": False
    },
    {
        "package_id": "pkg_300",
        "name": "Value Pack",
        "price_myr": 300.00,
        "credits": 29,
        "bonus_credits": 0,
        "savings": "Save RM135",
        "popular": True
    },
    {
        "package_id": "pkg_500",
        "name": "Premium Pack",
        "price_myr": 500.00,
        "credits": 50,
        "bonus_credits": 0,
        "savings": "Save RM250",
        "popular": False
    }
]

# Session duration to credits
def get_credits_for_duration(minutes: int) -> float:
    """Calculate credits needed for a session duration"""
    if minutes <= 15:
        return 1
    elif minutes <= 30:
        return 2
    elif minutes <= 60:
        return 4
    else:
        # For longer sessions, calculate based on 15-min blocks
        return (minutes // 15) * 1


# ============== REQUEST/RESPONSE MODELS ==============
class TopupRequest(BaseModel):
    package_id: str
    payment_method: str = "stripe"  # stripe, fpx, etc.


class CreditPurchaseRequest(BaseModel):
    credits: int  # 1, 2, or 4
    payment_method: str = "stripe"


class DeductCreditsRequest(BaseModel):
    booking_id: str
    credits: float
    description: Optional[str] = None


class RefundCreditsRequest(BaseModel):
    booking_id: str
    credits: float
    reason: str


# ============== WALLET MANAGEMENT ==============
async def get_or_create_wallet(student_id: str, user_id: str):
    """Get existing wallet or create new one for student"""
    wallet = await db.student_wallets.find_one({"student_id": student_id}, {"_id": 0})
    
    if not wallet:
        wallet_id = f"wallet_{uuid.uuid4().hex[:12]}"
        wallet = {
            "wallet_id": wallet_id,
            "student_id": student_id,
            "user_id": user_id,
            "credit_balance": 0.0,
            "total_topup_amount": 0.0,
            "total_credits_purchased": 0.0,
            "total_credits_used": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.student_wallets.insert_one(wallet)
    
    return wallet


async def add_transaction(
    wallet_id: str,
    student_id: str,
    transaction_type: str,
    credits: float,
    description: str,
    amount_myr: Optional[float] = None,
    reference_id: Optional[str] = None,
    status: str = "completed"
):
    """Add a transaction record"""
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    transaction = {
        "transaction_id": transaction_id,
        "wallet_id": wallet_id,
        "student_id": student_id,
        "transaction_type": transaction_type,
        "credits": credits,
        "amount_myr": amount_myr,
        "description": description,
        "reference_id": reference_id,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wallet_transactions.insert_one(transaction)
    return transaction_id


# ============== API ENDPOINTS ==============

@wallet_router.get("/balance")
async def get_wallet_balance(user_id: str):
    """Get student's wallet balance and info"""
    # Get student
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    # Remove _id if present
    if "_id" in wallet:
        del wallet["_id"]
    
    return {
        "wallet": wallet,
        "credit_value": {
            "per_credit_minutes": 15,
            "pricing": CREDIT_PRICING
        }
    }


@wallet_router.get("/transactions")
async def get_transactions(user_id: str, limit: int = 50, offset: int = 0):
    """Get wallet transaction history"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    transactions = await db.wallet_transactions.find(
        {"student_id": student["student_id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.wallet_transactions.count_documents({"student_id": student["student_id"]})
    
    return {
        "transactions": transactions,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@wallet_router.get("/packages")
async def get_topup_packages():
    """Get available top-up packages"""
    return {
        "packages": TOPUP_PACKAGES,
        "credit_pricing": CREDIT_PRICING,
        "credit_to_minutes": CREDITS_TO_MINUTES
    }


@wallet_router.post("/topup/create-intent")
async def create_topup_intent(request: TopupRequest, user_id: str):
    """Create a payment intent for topping up credits"""
    # Find the package
    package = next((p for p in TOPUP_PACKAGES if p["package_id"] == request.package_id), None)
    if not package:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    # Get student
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    # Create payment intent record (Stripe-compatible structure)
    intent_id = f"pi_{uuid.uuid4().hex[:24]}"
    payment_intent = {
        "payment_intent_id": intent_id,
        "wallet_id": wallet["wallet_id"],
        "student_id": student["student_id"],
        "user_id": user_id,
        "amount_myr": package["price_myr"],
        "credits_to_add": package["credits"] + package.get("bonus_credits", 0),
        "package_id": request.package_id,
        "package_name": package["name"],
        "stripe_payment_intent_id": None,  # Will be set when Stripe is integrated
        "stripe_client_secret": None,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    
    await db.payment_intents.insert_one(payment_intent)
    
    # In production, this would create a Stripe PaymentIntent
    # For now, return mock client secret for testing
    return {
        "payment_intent_id": intent_id,
        "amount_myr": package["price_myr"],
        "credits": package["credits"] + package.get("bonus_credits", 0),
        "client_secret": f"mock_secret_{intent_id}",  # Replace with Stripe client_secret
        "package": package
    }


@wallet_router.post("/topup/confirm")
async def confirm_topup(payment_intent_id: str, user_id: str):
    """
    Confirm a top-up payment (called after successful payment).
    In production, this would be called by Stripe webhook.
    For testing, this can be called directly.
    """
    # Find the payment intent
    intent = await db.payment_intents.find_one(
        {"payment_intent_id": payment_intent_id},
        {"_id": 0}
    )
    
    if not intent:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    
    if intent["status"] == "succeeded":
        raise HTTPException(status_code=400, detail="Payment already processed")
    
    # Verify user owns this intent
    if intent["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Update wallet
    wallet = await db.student_wallets.find_one(
        {"wallet_id": intent["wallet_id"]},
        {"_id": 0}
    )
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    new_balance = wallet["credit_balance"] + intent["credits_to_add"]
    new_total_topup = wallet["total_topup_amount"] + intent["amount_myr"]
    new_total_credits = wallet["total_credits_purchased"] + intent["credits_to_add"]
    
    await db.student_wallets.update_one(
        {"wallet_id": intent["wallet_id"]},
        {"$set": {
            "credit_balance": new_balance,
            "total_topup_amount": new_total_topup,
            "total_credits_purchased": new_total_credits,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update payment intent status
    await db.payment_intents.update_one(
        {"payment_intent_id": payment_intent_id},
        {"$set": {
            "status": "succeeded",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Add transaction record
    await add_transaction(
        wallet_id=intent["wallet_id"],
        student_id=intent["student_id"],
        transaction_type="topup",
        credits=intent["credits_to_add"],
        description=f"Top-up: {intent.get('package_name', 'Credit Package')}",
        amount_myr=intent["amount_myr"],
        reference_id=payment_intent_id
    )
    
    return {
        "success": True,
        "credits_added": intent["credits_to_add"],
        "new_balance": new_balance,
        "amount_paid": intent["amount_myr"]
    }


@wallet_router.post("/deduct")
async def deduct_credits(request: DeductCreditsRequest, user_id: str):
    """
    Deduct credits from wallet (called when session is completed).
    This should only be called by server-side processes.
    """
    # Get student
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    # Validate sufficient balance
    if wallet["credit_balance"] < request.credits:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient credits. Balance: {wallet['credit_balance']}, Required: {request.credits}"
        )
    
    # Verify booking exists and is completed
    booking = await db.bookings.find_one({"booking_id": request.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["status"] != "completed":
        raise HTTPException(status_code=400, detail="Credits can only be deducted for completed sessions")
    
    # Check if already deducted
    existing_txn = await db.wallet_transactions.find_one({
        "reference_id": request.booking_id,
        "transaction_type": "session_deduction"
    })
    if existing_txn:
        raise HTTPException(status_code=400, detail="Credits already deducted for this session")
    
    # Deduct credits
    new_balance = wallet["credit_balance"] - request.credits
    new_total_used = wallet["total_credits_used"] + request.credits
    
    await db.student_wallets.update_one(
        {"wallet_id": wallet["wallet_id"]},
        {"$set": {
            "credit_balance": new_balance,
            "total_credits_used": new_total_used,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Add transaction record
    description = request.description or f"Session with teacher"
    await add_transaction(
        wallet_id=wallet["wallet_id"],
        student_id=student["student_id"],
        transaction_type="session_deduction",
        credits=-request.credits,
        description=description,
        reference_id=request.booking_id
    )
    
    return {
        "success": True,
        "credits_deducted": request.credits,
        "new_balance": new_balance
    }


@wallet_router.post("/refund")
async def refund_credits(request: RefundCreditsRequest, user_id: str):
    """Refund credits to wallet (for cancelled sessions)"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    # Add credits back
    new_balance = wallet["credit_balance"] + request.credits
    
    await db.student_wallets.update_one(
        {"wallet_id": wallet["wallet_id"]},
        {"$set": {
            "credit_balance": new_balance,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Add transaction record
    await add_transaction(
        wallet_id=wallet["wallet_id"],
        student_id=student["student_id"],
        transaction_type="refund",
        credits=request.credits,
        description=f"Refund: {request.reason}",
        reference_id=request.booking_id
    )
    
    return {
        "success": True,
        "credits_refunded": request.credits,
        "new_balance": new_balance
    }


@wallet_router.post("/add-bonus")
async def add_bonus_credits(user_id: str, credits: float, description: str):
    """Add bonus credits (admin function)"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    new_balance = wallet["credit_balance"] + credits
    
    await db.student_wallets.update_one(
        {"wallet_id": wallet["wallet_id"]},
        {"$set": {
            "credit_balance": new_balance,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await add_transaction(
        wallet_id=wallet["wallet_id"],
        student_id=student["student_id"],
        transaction_type="bonus",
        credits=credits,
        description=description
    )
    
    return {
        "success": True,
        "credits_added": credits,
        "new_balance": new_balance
    }


@wallet_router.get("/check-balance")
async def check_balance_for_booking(user_id: str, duration_minutes: int):
    """Check if student has enough credits for a booking"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    required_credits = get_credits_for_duration(duration_minutes)
    has_sufficient = wallet["credit_balance"] >= required_credits
    
    return {
        "has_sufficient_credits": has_sufficient,
        "current_balance": wallet["credit_balance"],
        "required_credits": required_credits,
        "duration_minutes": duration_minutes
    }


# ============== STRIPE WEBHOOK (Production Ready) ==============
@wallet_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """
    Stripe webhook endpoint for payment confirmations.
    In production, verify the signature using Stripe's webhook secret.
    """
    payload = await request.body()
    
    # In production, verify the webhook signature
    # stripe_webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    # try:
    #     event = stripe.Webhook.construct_event(
    #         payload, stripe_signature, stripe_webhook_secret
    #     )
    # except ValueError as e:
    #     raise HTTPException(status_code=400, detail="Invalid payload")
    # except stripe.error.SignatureVerificationError as e:
    #     raise HTTPException(status_code=400, detail="Invalid signature")
    
    # For now, parse the payload directly (development mode)
    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = event.get("type")
    
    if event_type == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        stripe_pi_id = payment_intent["id"]
        
        # Find our payment intent record
        intent = await db.payment_intents.find_one(
            {"stripe_payment_intent_id": stripe_pi_id},
            {"_id": 0}
        )
        
        if intent and intent["status"] != "succeeded":
            # Process the top-up
            wallet = await db.student_wallets.find_one(
                {"wallet_id": intent["wallet_id"]},
                {"_id": 0}
            )
            
            if wallet:
                new_balance = wallet["credit_balance"] + intent["credits_to_add"]
                new_total_topup = wallet["total_topup_amount"] + intent["amount_myr"]
                new_total_credits = wallet["total_credits_purchased"] + intent["credits_to_add"]
                
                await db.student_wallets.update_one(
                    {"wallet_id": intent["wallet_id"]},
                    {"$set": {
                        "credit_balance": new_balance,
                        "total_topup_amount": new_total_topup,
                        "total_credits_purchased": new_total_credits,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                await db.payment_intents.update_one(
                    {"payment_intent_id": intent["payment_intent_id"]},
                    {"$set": {
                        "status": "succeeded",
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                await add_transaction(
                    wallet_id=intent["wallet_id"],
                    student_id=intent["student_id"],
                    transaction_type="topup",
                    credits=intent["credits_to_add"],
                    description=f"Top-up: {intent.get('package_name', 'Credit Package')}",
                    amount_myr=intent["amount_myr"],
                    reference_id=intent["payment_intent_id"]
                )
    
    elif event_type == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        stripe_pi_id = payment_intent["id"]
        
        await db.payment_intents.update_one(
            {"stripe_payment_intent_id": stripe_pi_id},
            {"$set": {"status": "failed"}}
        )
    
    return {"received": True}


# ============== HELPER ENDPOINT FOR CALCULATING SESSION COST ==============
@wallet_router.get("/calculate-cost")
async def calculate_session_cost(duration_minutes: int):
    """Calculate the credit cost for a session duration"""
    credits = get_credits_for_duration(duration_minutes)
    
    return {
        "duration_minutes": duration_minutes,
        "credits_required": credits,
        "equivalent_rm": credits * 15,  # Base rate RM15 per credit
        "breakdown": {
            "15_min_blocks": duration_minutes // 15,
            "credits_per_block": 1
        }
    }
