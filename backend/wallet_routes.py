from fastapi import APIRouter, HTTPException, Request, Header
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid
import json
import os

wallet_router = APIRouter(prefix="/api/wallet")

# Database will be injected from server.py
db = None

def init_wallet_routes(database):
    global db
    db = database


# ============== CREDIT SYSTEM CONSTANTS ==============
# Base pricing - ALWAYS used for commission calculations
BASE_CREDIT_PRICE = 15.0  # RM15 per credit (base rate)

# Credit to minutes conversion
CREDITS_TO_MINUTES = {
    1: 15,   # 1 credit = 15 minutes
    2: 30,   # 2 credits = 30 minutes
    4: 60,   # 4 credits = 60 minutes
}

# Base session pricing (used for commission calculations)
SESSION_BASE_PRICES = {
    15: 15.00,   # 15 mins = RM15
    30: 27.00,   # 30 mins = RM27
    60: 50.00,   # 60 mins = RM50
}

# Default commission rate - DEPRECATED: Use commission_routes.get_tutor_commission_rate()
# This is kept for backwards compatibility but tiered commission is now the standard
DEFAULT_COMMISSION_RATE = 0.30  # 30% platform commission (New Tutor default)

# Credit pricing (individual purchase - no bonus)
CREDIT_PRICING = {
    1: 15.00,   # 1 credit = RM15 (0 bonus)
    2: 27.00,   # 2 credits = RM27 (0 bonus)
    4: 50.00,   # 4 credits = RM50 (0 bonus)
}

# Top-up packages with SEPARATE paid and bonus credits
# Based on user requirements:
# RM100 → 8 paid + 1 bonus = 9 total
# RM300 → 24 paid + 3 bonus = 27 total  
# RM500 → 40 paid + 6 bonus = 46 total
TOPUP_PACKAGES = [
    {
        "package_id": "pkg_100",
        "name": "Starter Pack",
        "price_myr": 100.00,
        "paid_credits": 8,      # RM100 / RM12.50 = 8 paid credits
        "bonus_credits": 1,     # +1 bonus credit (marketing incentive)
        "total_credits": 9,
        "savings_display": "+1 bonus credit",
        "popular": False
    },
    {
        "package_id": "pkg_300",
        "name": "Value Pack",
        "price_myr": 300.00,
        "paid_credits": 24,     # RM300 / RM12.50 = 24 paid credits
        "bonus_credits": 3,     # +3 bonus credits (marketing incentive)
        "total_credits": 27,
        "savings_display": "+3 bonus credits",
        "popular": True
    },
    {
        "package_id": "pkg_500",
        "name": "Premium Pack",
        "price_myr": 500.00,
        "paid_credits": 40,     # RM500 / RM12.50 = 40 paid credits
        "bonus_credits": 6,     # +6 bonus credits (marketing incentive)
        "total_credits": 46,
        "savings_display": "+6 bonus credits",
        "popular": False
    }
]

# Bonus credit expiry (12 months from date of receipt)
BONUS_CREDIT_EXPIRY_MONTHS = 12


def get_credits_for_duration(minutes: int) -> float:
    """Calculate credits needed for a session duration"""
    if minutes <= 15:
        return 1
    elif minutes <= 30:
        return 2
    elif minutes <= 60:
        return 4
    else:
        return (minutes // 15) * 1


def get_base_session_price(minutes: int) -> float:
    """Get the base session price for commission calculation"""
    if minutes <= 15:
        return SESSION_BASE_PRICES[15]
    elif minutes <= 30:
        return SESSION_BASE_PRICES[30]
    elif minutes <= 60:
        return SESSION_BASE_PRICES[60]
    else:
        # For longer sessions, calculate proportionally
        return (minutes / 60) * SESSION_BASE_PRICES[60]


# ============== REQUEST/RESPONSE MODELS ==============
class TopupRequest(BaseModel):
    package_id: str
    payment_method: str = "stripe"


class DeductCreditsRequest(BaseModel):
    booking_id: str
    duration_minutes: int
    teacher_id: str
    commission_rate: Optional[float] = None  # Defaults to DEFAULT_COMMISSION_RATE


class RefundCreditsRequest(BaseModel):
    booking_id: str
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
            "paid_credits": 0.0,
            "bonus_credits": 0.0,
            "total_topup_amount": 0.0,
            "total_paid_credits_purchased": 0.0,
            "total_bonus_credits_received": 0.0,
            "total_credits_used": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.student_wallets.insert_one(wallet)
    else:
        # Migrate old wallets to new structure
        if "paid_credits" not in wallet:
            wallet["paid_credits"] = wallet.get("credit_balance", 0.0)
            wallet["bonus_credits"] = 0.0
            wallet["total_paid_credits_purchased"] = wallet.get("total_credits_purchased", 0.0)
            wallet["total_bonus_credits_received"] = 0.0
            await db.student_wallets.update_one(
                {"wallet_id": wallet["wallet_id"]},
                {"$set": {
                    "paid_credits": wallet["paid_credits"],
                    "bonus_credits": wallet["bonus_credits"],
                    "total_paid_credits_purchased": wallet["total_paid_credits_purchased"],
                    "total_bonus_credits_received": wallet["total_bonus_credits_received"]
                }}
            )
    
    return wallet


async def add_transaction(
    wallet_id: str,
    student_id: str,
    transaction_type: str,
    credit_amount: float,
    description: str,
    monetary_value: Optional[float] = None,
    payment_amount: Optional[float] = None,
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
        "credit_amount": credit_amount,
        "monetary_value": monetary_value,  # RM value at base rate
        "payment_amount": payment_amount,  # Actual RM paid
        "description": description,
        "reference_id": reference_id,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wallet_transactions.insert_one(transaction)
    return transaction_id


async def create_bonus_credit_batch(
    wallet_id: str,
    student_id: str,
    credit_amount: float,
    source: str,
    reference_id: Optional[str] = None
):
    """Create a bonus credit batch with 12-month expiry"""
    batch_id = f"bcb_{uuid.uuid4().hex[:12]}"
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(days=BONUS_CREDIT_EXPIRY_MONTHS * 30)  # Approx 12 months
    
    batch = {
        "batch_id": batch_id,
        "wallet_id": wallet_id,
        "student_id": student_id,
        "credit_amount": credit_amount,
        "remaining_credits": credit_amount,
        "source": source,
        "reference_id": reference_id,
        "issued_at": issued_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "is_expired": False,
        "expired_credits": 0.0
    }
    await db.bonus_credit_batches.insert_one(batch)
    return batch_id


async def deduct_from_bonus_batches(wallet_id: str, amount_to_deduct: float):
    """
    Deduct bonus credits from batches in FIFO order (oldest first).
    Returns the actual amount deducted.
    """
    batches = await db.bonus_credit_batches.find(
        {
            "wallet_id": wallet_id,
            "remaining_credits": {"$gt": 0},
            "is_expired": False
        },
        {"_id": 0}
    ).sort("issued_at", 1).to_list(100)  # FIFO: oldest first
    
    total_deducted = 0.0
    remaining_to_deduct = amount_to_deduct
    
    for batch in batches:
        if remaining_to_deduct <= 0:
            break
            
        deduct_from_batch = min(batch["remaining_credits"], remaining_to_deduct)
        new_remaining = batch["remaining_credits"] - deduct_from_batch
        
        await db.bonus_credit_batches.update_one(
            {"batch_id": batch["batch_id"]},
            {"$set": {"remaining_credits": new_remaining}}
        )
        
        total_deducted += deduct_from_batch
        remaining_to_deduct -= deduct_from_batch
    
    return total_deducted


async def expire_bonus_credits():
    """
    Scheduled job to expire bonus credits older than 12 months.
    Returns summary of expired credits.
    """
    now = datetime.now(timezone.utc)
    
    # Find all non-expired batches that have passed their expiry date
    expired_batches = await db.bonus_credit_batches.find(
        {
            "is_expired": False,
            "expires_at": {"$lt": now.isoformat()},
            "remaining_credits": {"$gt": 0}
        },
        {"_id": 0}
    ).to_list(1000)
    
    total_expired = 0.0
    wallets_affected = set()
    
    for batch in expired_batches:
        expired_amount = batch["remaining_credits"]
        total_expired += expired_amount
        wallets_affected.add(batch["wallet_id"])
        
        # Mark batch as expired
        await db.bonus_credit_batches.update_one(
            {"batch_id": batch["batch_id"]},
            {"$set": {
                "is_expired": True,
                "expired_credits": expired_amount,
                "remaining_credits": 0
            }}
        )
        
        # Update wallet balance
        wallet = await db.student_wallets.find_one({"wallet_id": batch["wallet_id"]}, {"_id": 0})
        if wallet:
            new_bonus = max(0, wallet.get("bonus_credits", 0) - expired_amount)
            new_balance = wallet.get("paid_credits", 0) + new_bonus
            
            await db.student_wallets.update_one(
                {"wallet_id": batch["wallet_id"]},
                {"$set": {
                    "bonus_credits": new_bonus,
                    "credit_balance": new_balance,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Add expiry transaction
            await add_transaction(
                wallet_id=batch["wallet_id"],
                student_id=batch["student_id"],
                transaction_type="bonus_expired",
                credit_amount=-expired_amount,
                description="Bonus credits expired (12-month expiry)",
                reference_id=batch["batch_id"]
            )
    
    return {
        "total_expired": total_expired,
        "batches_expired": len(expired_batches),
        "wallets_affected": len(wallets_affected)
    }


# ============== API ENDPOINTS ==============

@wallet_router.get("/balance")
async def get_wallet_balance(user_id: str):
    """Get student's wallet balance with paid/bonus breakdown"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    if "_id" in wallet:
        del wallet["_id"]
    
    return {
        "wallet": wallet,
        "credit_info": {
            "base_price_per_credit": BASE_CREDIT_PRICE,
            "minutes_per_credit": 15,
            "session_prices": SESSION_BASE_PRICES
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
    """Get available top-up packages with paid/bonus breakdown"""
    return {
        "packages": TOPUP_PACKAGES,
        "credit_pricing": CREDIT_PRICING,
        "credit_to_minutes": CREDITS_TO_MINUTES,
        "base_credit_price": BASE_CREDIT_PRICE,
        "note": "Bonus credits are promotional - commission is always calculated from base session price"
    }


@wallet_router.post("/topup/create-intent")
async def create_topup_intent(request: TopupRequest, user_id: str):
    """Create a payment intent for topping up credits"""
    package = next((p for p in TOPUP_PACKAGES if p["package_id"] == request.package_id), None)
    if not package:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    intent_id = f"pi_{uuid.uuid4().hex[:24]}"
    payment_intent = {
        "payment_intent_id": intent_id,
        "wallet_id": wallet["wallet_id"],
        "student_id": student["student_id"],
        "user_id": user_id,
        "amount_myr": package["price_myr"],
        "paid_credits_to_add": package["paid_credits"],
        "bonus_credits_to_add": package["bonus_credits"],
        "total_credits": package["total_credits"],
        "package_id": request.package_id,
        "package_name": package["name"],
        "stripe_payment_intent_id": None,
        "stripe_client_secret": None,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    
    await db.payment_intents.insert_one(payment_intent)
    
    return {
        "payment_intent_id": intent_id,
        "amount_myr": package["price_myr"],
        "paid_credits": package["paid_credits"],
        "bonus_credits": package["bonus_credits"],
        "total_credits": package["total_credits"],
        "client_secret": f"mock_secret_{intent_id}",
        "package": package
    }


@wallet_router.post("/topup/confirm")
async def confirm_topup(payment_intent_id: str, user_id: str):
    """Confirm a top-up payment - adds SEPARATE paid and bonus credits"""
    intent = await db.payment_intents.find_one(
        {"payment_intent_id": payment_intent_id},
        {"_id": 0}
    )
    
    if not intent:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    
    if intent["status"] == "succeeded":
        raise HTTPException(status_code=400, detail="Payment already processed")
    
    if intent["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    wallet = await db.student_wallets.find_one(
        {"wallet_id": intent["wallet_id"]},
        {"_id": 0}
    )
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    paid_credits = intent.get("paid_credits_to_add", intent.get("credits_to_add", 0))
    bonus_credits = intent.get("bonus_credits_to_add", 0)
    total_credits = paid_credits + bonus_credits
    
    # Update wallet with SEPARATE paid and bonus credits
    new_paid = wallet.get("paid_credits", wallet.get("credit_balance", 0)) + paid_credits
    new_bonus = wallet.get("bonus_credits", 0) + bonus_credits
    new_balance = new_paid + new_bonus
    new_total_topup = wallet["total_topup_amount"] + intent["amount_myr"]
    new_total_paid = wallet.get("total_paid_credits_purchased", wallet.get("total_credits_purchased", 0)) + paid_credits
    new_total_bonus = wallet.get("total_bonus_credits_received", 0) + bonus_credits
    
    await db.student_wallets.update_one(
        {"wallet_id": intent["wallet_id"]},
        {"$set": {
            "credit_balance": new_balance,
            "paid_credits": new_paid,
            "bonus_credits": new_bonus,
            "total_topup_amount": new_total_topup,
            "total_paid_credits_purchased": new_total_paid,
            "total_bonus_credits_received": new_total_bonus,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.payment_intents.update_one(
        {"payment_intent_id": payment_intent_id},
        {"$set": {
            "status": "succeeded",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Add SEPARATE transaction records for paid and bonus credits
    await add_transaction(
        wallet_id=intent["wallet_id"],
        student_id=intent["student_id"],
        transaction_type="topup_paid",
        credit_amount=paid_credits,
        description=f"Top-up: {intent.get('package_name', 'Credit Package')} (Paid Credits)",
        monetary_value=paid_credits * BASE_CREDIT_PRICE,
        payment_amount=intent["amount_myr"],
        reference_id=payment_intent_id
    )
    
    if bonus_credits > 0:
        await add_transaction(
            wallet_id=intent["wallet_id"],
            student_id=intent["student_id"],
            transaction_type="topup_bonus",
            credit_amount=bonus_credits,
            description=f"Bonus: {intent.get('package_name', 'Credit Package')} (Promotional Credits)",
            monetary_value=bonus_credits * BASE_CREDIT_PRICE,  # Marketing cost absorbed by platform
            payment_amount=0,  # Bonus = no payment
            reference_id=payment_intent_id
        )
        
        # Create bonus credit batch for expiry tracking (12-month expiry)
        await create_bonus_credit_batch(
            wallet_id=intent["wallet_id"],
            student_id=intent["student_id"],
            credit_amount=bonus_credits,
            source="topup_bonus",
            reference_id=payment_intent_id
        )
    
    return {
        "success": True,
        "paid_credits_added": paid_credits,
        "bonus_credits_added": bonus_credits,
        "total_credits_added": total_credits,
        "new_balance": {
            "total": new_balance,
            "paid": new_paid,
            "bonus": new_bonus
        },
        "amount_paid": intent["amount_myr"]
    }


@wallet_router.post("/deduct")
async def deduct_credits(request: DeductCreditsRequest, user_id: str):
    """
    Deduct credits from wallet after session completion.
    ALWAYS calculates commission from base session price, NOT from credit cost.
    Deducts from paid_credits FIRST, then bonus_credits.
    """
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    # Calculate credits needed
    credits_needed = get_credits_for_duration(request.duration_minutes)
    
    # Get available credits
    paid_available = wallet.get("paid_credits", wallet.get("credit_balance", 0))
    bonus_available = wallet.get("bonus_credits", 0)
    total_available = paid_available + bonus_available
    
    # Validate sufficient balance
    if total_available < credits_needed:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient credits. Balance: {total_available}, Required: {credits_needed}"
        )
    
    # Verify booking exists and is completed
    booking = await db.bookings.find_one({"booking_id": request.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["status"] != "completed":
        raise HTTPException(status_code=400, detail="Credits can only be deducted for completed sessions")
    
    # Check if already deducted
    existing_record = await db.session_payment_records.find_one({
        "booking_id": request.booking_id
    })
    if existing_record:
        raise HTTPException(status_code=400, detail="Credits already deducted for this session")
    
    # DEDUCT FROM PAID CREDITS FIRST, THEN BONUS
    paid_to_deduct = min(paid_available, credits_needed)
    bonus_to_deduct = credits_needed - paid_to_deduct
    
    # Calculate commission from BASE SESSION PRICE (not from credit cost!)
    base_session_price = get_base_session_price(request.duration_minutes)
    
    # GET TUTOR'S TIERED COMMISSION RATE (SERVER-SIDE ONLY)
    # Import here to avoid circular imports
    from commission_routes import get_tutor_commission_rate
    tutor_commission_rate = await get_tutor_commission_rate(request.teacher_id)
    
    # Use tutor's tier-based commission rate
    commission_rate = tutor_commission_rate
    
    tutor_payout = round(base_session_price * (1 - commission_rate), 2)
    platform_commission = round(base_session_price * commission_rate, 2)
    
    # Calculate marketing cost (value of bonus credits used - absorbed by platform)
    platform_marketing_cost = bonus_to_deduct * BASE_CREDIT_PRICE
    
    # Update wallet
    new_paid = paid_available - paid_to_deduct
    new_bonus = bonus_available - bonus_to_deduct
    new_balance = new_paid + new_bonus
    new_total_used = wallet.get("total_credits_used", 0) + credits_needed
    
    await db.student_wallets.update_one(
        {"wallet_id": wallet["wallet_id"]},
        {"$set": {
            "credit_balance": new_balance,
            "paid_credits": new_paid,
            "bonus_credits": new_bonus,
            "total_credits_used": new_total_used,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create session payment record for commission tracking
    # Get teacher's tier info for audit
    teacher_data = await db.teachers.find_one({"teacher_id": request.teacher_id}, {"_id": 0})
    teacher_tier = teacher_data.get("tier_level", "new") if teacher_data else "new"
    
    record_id = f"spr_{uuid.uuid4().hex[:12]}"
    session_payment_record = {
        "record_id": record_id,
        "booking_id": request.booking_id,
        "student_id": student["student_id"],
        "teacher_id": request.teacher_id,
        "teacher_tier": teacher_tier,  # Track tier at time of session
        "duration_minutes": request.duration_minutes,
        "credits_used": credits_needed,
        "paid_credits_used": paid_to_deduct,
        "bonus_credits_used": bonus_to_deduct,
        "base_session_price": base_session_price,
        "commission_rate": commission_rate,
        "tutor_payout": tutor_payout,
        "platform_commission": platform_commission,
        "platform_marketing_cost": platform_marketing_cost,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.session_payment_records.insert_one(session_payment_record)
    
    # Add transaction record
    await add_transaction(
        wallet_id=wallet["wallet_id"],
        student_id=student["student_id"],
        transaction_type="session_deduction",
        credit_amount=-credits_needed,
        description=f"Session ({request.duration_minutes} mins) - {paid_to_deduct:.1f} paid + {bonus_to_deduct:.1f} bonus credits",
        monetary_value=base_session_price,
        reference_id=request.booking_id
    )
    
    # CREDIT TUTOR EARNINGS (commission already deducted)
    from tutor_earnings_routes import credit_tutor_earnings
    
    # Get teacher's user_id
    if teacher_data:
        teacher_user_id = teacher_data.get("user_id")
        if teacher_user_id:
            await credit_tutor_earnings(
                teacher_id=request.teacher_id,
                user_id=teacher_user_id,
                amount=tutor_payout,
                booking_id=request.booking_id,
                session_payment_record_id=record_id,
                description=f"Session earning ({request.duration_minutes} mins) - {teacher_tier} tier @ {int((1 - commission_rate) * 100)}%"
            )
    
    return {
        "success": True,
        "deduction": {
            "total_credits": credits_needed,
            "paid_credits_used": paid_to_deduct,
            "bonus_credits_used": bonus_to_deduct
        },
        "new_balance": {
            "total": new_balance,
            "paid": new_paid,
            "bonus": new_bonus
        },
        "commission_breakdown": {
            "base_session_price": base_session_price,
            "commission_rate": commission_rate,
            "tutor_payout": tutor_payout,
            "platform_commission": platform_commission,
            "platform_marketing_cost": platform_marketing_cost,
            "note": "Commission calculated from base session price, NOT from discounted credit cost"
        }
    }


@wallet_router.post("/refund")
async def refund_credits(request: RefundCreditsRequest, user_id: str):
    """Refund credits to wallet (for cancelled sessions)"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Find the original session payment record
    session_record = await db.session_payment_records.find_one(
        {"booking_id": request.booking_id},
        {"_id": 0}
    )
    
    if not session_record:
        raise HTTPException(status_code=404, detail="No payment record found for this booking")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    # Refund SEPARATELY - paid credits back to paid, bonus back to bonus
    paid_to_refund = session_record.get("paid_credits_used", 0)
    bonus_to_refund = session_record.get("bonus_credits_used", 0)
    total_refund = paid_to_refund + bonus_to_refund
    
    new_paid = wallet.get("paid_credits", 0) + paid_to_refund
    new_bonus = wallet.get("bonus_credits", 0) + bonus_to_refund
    new_balance = new_paid + new_bonus
    
    await db.student_wallets.update_one(
        {"wallet_id": wallet["wallet_id"]},
        {"$set": {
            "credit_balance": new_balance,
            "paid_credits": new_paid,
            "bonus_credits": new_bonus,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Add refund transactions
    if paid_to_refund > 0:
        await add_transaction(
            wallet_id=wallet["wallet_id"],
            student_id=student["student_id"],
            transaction_type="refund_paid",
            credit_amount=paid_to_refund,
            description=f"Refund (Paid Credits): {request.reason}",
            monetary_value=paid_to_refund * BASE_CREDIT_PRICE,
            reference_id=request.booking_id
        )
    
    if bonus_to_refund > 0:
        await add_transaction(
            wallet_id=wallet["wallet_id"],
            student_id=student["student_id"],
            transaction_type="refund_bonus",
            credit_amount=bonus_to_refund,
            description=f"Refund (Bonus Credits): {request.reason}",
            monetary_value=bonus_to_refund * BASE_CREDIT_PRICE,
            reference_id=request.booking_id
        )
    
    # Mark session payment record as refunded
    await db.session_payment_records.update_one(
        {"booking_id": request.booking_id},
        {"$set": {"refunded": True, "refund_reason": request.reason}}
    )
    
    return {
        "success": True,
        "refund": {
            "paid_credits": paid_to_refund,
            "bonus_credits": bonus_to_refund,
            "total": total_refund
        },
        "new_balance": {
            "total": new_balance,
            "paid": new_paid,
            "bonus": new_bonus
        }
    }


@wallet_router.post("/add-bonus")
async def add_bonus_credits(user_id: str, credits: float, description: str):
    """Add promotional bonus credits (admin function)"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    # Add to BONUS credits only (not paid)
    new_bonus = wallet.get("bonus_credits", 0) + credits
    new_balance = wallet.get("paid_credits", 0) + new_bonus
    new_total_bonus = wallet.get("total_bonus_credits_received", 0) + credits
    
    await db.student_wallets.update_one(
        {"wallet_id": wallet["wallet_id"]},
        {"$set": {
            "credit_balance": new_balance,
            "bonus_credits": new_bonus,
            "total_bonus_credits_received": new_total_bonus,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await add_transaction(
        wallet_id=wallet["wallet_id"],
        student_id=student["student_id"],
        transaction_type="bonus_reward",
        credit_amount=credits,
        description=description,
        monetary_value=credits * BASE_CREDIT_PRICE  # Marketing cost
    )
    
    return {
        "success": True,
        "bonus_credits_added": credits,
        "new_balance": {
            "total": new_balance,
            "paid": wallet.get("paid_credits", 0),
            "bonus": new_bonus
        },
        "note": "Bonus credits are promotional - absorbed as platform marketing cost"
    }


@wallet_router.get("/check-balance")
async def check_balance_for_booking(user_id: str, duration_minutes: int):
    """Check if student has enough credits for a booking"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    required_credits = get_credits_for_duration(duration_minutes)
    total_available = wallet.get("credit_balance", 0)
    has_sufficient = total_available >= required_credits
    
    return {
        "has_sufficient_credits": has_sufficient,
        "balance": {
            "total": total_available,
            "paid": wallet.get("paid_credits", 0),
            "bonus": wallet.get("bonus_credits", 0)
        },
        "required_credits": required_credits,
        "duration_minutes": duration_minutes,
        "base_session_price": get_base_session_price(duration_minutes)
    }


@wallet_router.get("/calculate-cost")
async def calculate_session_cost(duration_minutes: int):
    """Calculate the credit cost and commission breakdown for a session"""
    credits = get_credits_for_duration(duration_minutes)
    base_price = get_base_session_price(duration_minutes)
    
    return {
        "duration_minutes": duration_minutes,
        "credits_required": credits,
        "base_session_price": base_price,
        "commission_breakdown": {
            "commission_rate": DEFAULT_COMMISSION_RATE,
            "tutor_payout": base_price * (1 - DEFAULT_COMMISSION_RATE),
            "platform_commission": base_price * DEFAULT_COMMISSION_RATE
        },
        "note": "Commission is ALWAYS calculated from base session price, regardless of how credits were obtained"
    }


# ============== ADMIN ENDPOINTS ==============

@wallet_router.get("/admin/session-records")
async def get_session_payment_records(limit: int = 50, offset: int = 0):
    """Admin: Get all session payment records with commission breakdown"""
    records = await db.session_payment_records.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.session_payment_records.count_documents({})
    
    # Calculate totals
    pipeline = [
        {"$group": {
            "_id": None,
            "total_tutor_payouts": {"$sum": "$tutor_payout"},
            "total_platform_commission": {"$sum": "$platform_commission"},
            "total_marketing_cost": {"$sum": "$platform_marketing_cost"},
            "total_sessions": {"$sum": 1}
        }}
    ]
    
    summary_result = await db.session_payment_records.aggregate(pipeline).to_list(1)
    summary = summary_result[0] if summary_result else {
        "total_tutor_payouts": 0,
        "total_platform_commission": 0,
        "total_marketing_cost": 0,
        "total_sessions": 0
    }
    
    return {
        "records": records,
        "total": total,
        "summary": {
            "total_tutor_payouts": summary.get("total_tutor_payouts", 0),
            "total_platform_commission": summary.get("total_platform_commission", 0),
            "total_marketing_cost": summary.get("total_marketing_cost", 0),
            "net_platform_revenue": summary.get("total_platform_commission", 0) - summary.get("total_marketing_cost", 0),
            "total_sessions": summary.get("total_sessions", 0)
        }
    }


@wallet_router.get("/admin/marketing-cost-report")
async def get_marketing_cost_report():
    """Admin: Get report on bonus credits (marketing cost)"""
    # Total bonus credits given
    wallet_pipeline = [
        {"$group": {
            "_id": None,
            "total_bonus_given": {"$sum": "$total_bonus_credits_received"}
        }}
    ]
    wallet_result = await db.student_wallets.aggregate(wallet_pipeline).to_list(1)
    total_bonus_given = wallet_result[0]["total_bonus_given"] if wallet_result else 0
    
    # Bonus credits used in sessions
    session_pipeline = [
        {"$group": {
            "_id": None,
            "total_bonus_used": {"$sum": "$bonus_credits_used"},
            "total_marketing_cost": {"$sum": "$platform_marketing_cost"}
        }}
    ]
    session_result = await db.session_payment_records.aggregate(session_pipeline).to_list(1)
    
    return {
        "bonus_credits": {
            "total_given": total_bonus_given,
            "total_used": session_result[0]["total_bonus_used"] if session_result else 0,
            "marketing_cost_realized": session_result[0]["total_marketing_cost"] if session_result else 0,
            "value_at_base_rate": total_bonus_given * BASE_CREDIT_PRICE
        },
        "base_credit_price": BASE_CREDIT_PRICE,
        "note": "Marketing cost = bonus credits × base credit price (RM15/credit)"
    }


# ============== STRIPE WEBHOOK ==============
@wallet_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Stripe webhook for payment confirmations"""
    payload = await request.body()
    
    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = event.get("type")
    
    if event_type == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        stripe_pi_id = payment_intent["id"]
        
        intent = await db.payment_intents.find_one(
            {"stripe_payment_intent_id": stripe_pi_id},
            {"_id": 0}
        )
        
        if intent and intent["status"] != "succeeded":
            wallet = await db.student_wallets.find_one(
                {"wallet_id": intent["wallet_id"]},
                {"_id": 0}
            )
            
            if wallet:
                paid_credits = intent.get("paid_credits_to_add", 0)
                bonus_credits = intent.get("bonus_credits_to_add", 0)
                
                new_paid = wallet.get("paid_credits", 0) + paid_credits
                new_bonus = wallet.get("bonus_credits", 0) + bonus_credits
                new_balance = new_paid + new_bonus
                
                await db.student_wallets.update_one(
                    {"wallet_id": intent["wallet_id"]},
                    {"$set": {
                        "credit_balance": new_balance,
                        "paid_credits": new_paid,
                        "bonus_credits": new_bonus,
                        "total_topup_amount": wallet["total_topup_amount"] + intent["amount_myr"],
                        "total_paid_credits_purchased": wallet.get("total_paid_credits_purchased", 0) + paid_credits,
                        "total_bonus_credits_received": wallet.get("total_bonus_credits_received", 0) + bonus_credits,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                await db.payment_intents.update_one(
                    {"payment_intent_id": intent["payment_intent_id"]},
                    {"$set": {"status": "succeeded", "completed_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Add separate transactions for paid and bonus
                await add_transaction(
                    wallet_id=intent["wallet_id"],
                    student_id=intent["student_id"],
                    transaction_type="topup_paid",
                    credit_amount=paid_credits,
                    description=f"Top-up: {intent.get('package_name', 'Package')} (Paid)",
                    monetary_value=paid_credits * BASE_CREDIT_PRICE,
                    payment_amount=intent["amount_myr"],
                    reference_id=intent["payment_intent_id"]
                )
                
                if bonus_credits > 0:
                    await add_transaction(
                        wallet_id=intent["wallet_id"],
                        student_id=intent["student_id"],
                        transaction_type="topup_bonus",
                        credit_amount=bonus_credits,
                        description=f"Bonus: {intent.get('package_name', 'Package')} (Promotional)",
                        monetary_value=bonus_credits * BASE_CREDIT_PRICE,
                        payment_amount=0,
                        reference_id=intent["payment_intent_id"]
                    )
                    
                    # Create bonus credit batch for expiry tracking
                    await create_bonus_credit_batch(
                        wallet_id=intent["wallet_id"],
                        student_id=intent["student_id"],
                        credit_amount=bonus_credits,
                        source="topup_bonus",
                        reference_id=intent["payment_intent_id"]
                    )
    
    return {"received": True}


# ============== BONUS CREDIT EXPIRY ENDPOINTS ==============

@wallet_router.get("/bonus-credits")
async def get_bonus_credit_details(user_id: str):
    """Get detailed breakdown of bonus credits including expiry dates"""
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    wallet = await get_or_create_wallet(student["student_id"], user_id)
    
    # Get all bonus credit batches for this wallet
    batches = await db.bonus_credit_batches.find(
        {"wallet_id": wallet["wallet_id"]},
        {"_id": 0}
    ).sort("expires_at", 1).to_list(100)
    
    # Separate active and expired batches
    active_batches = [b for b in batches if not b.get("is_expired", False) and b.get("remaining_credits", 0) > 0]
    expired_batches = [b for b in batches if b.get("is_expired", False)]
    
    # Find nearest expiry
    nearest_expiry = None
    if active_batches:
        nearest_expiry = active_batches[0].get("expires_at")
    
    return {
        "total_bonus_credits": wallet.get("bonus_credits", 0),
        "active_batches": active_batches,
        "expired_batches": expired_batches,
        "nearest_expiry": nearest_expiry,
        "expiry_policy_months": BONUS_CREDIT_EXPIRY_MONTHS
    }


@wallet_router.post("/admin/expire-bonus-credits")
async def run_bonus_credit_expiry():
    """Admin: Manually run the bonus credit expiry job"""
    result = await expire_bonus_credits()
    return {
        "success": True,
        "result": result
    }


@wallet_router.get("/admin/bonus-credit-batches")
async def get_all_bonus_credit_batches(
    include_expired: bool = False,
    limit: int = 100,
    offset: int = 0
):
    """Admin: Get all bonus credit batches across all students"""
    query = {}
    if not include_expired:
        query["is_expired"] = False
    
    batches = await db.bonus_credit_batches.find(
        query,
        {"_id": 0}
    ).sort("expires_at", 1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.bonus_credit_batches.count_documents(query)
    
    # Summary stats
    pipeline = [
        {"$match": {"is_expired": False}},
        {"$group": {
            "_id": None,
            "total_active_bonus": {"$sum": "$remaining_credits"},
            "total_batches": {"$sum": 1}
        }}
    ]
    summary_result = await db.bonus_credit_batches.aggregate(pipeline).to_list(1)
    summary = summary_result[0] if summary_result else {"total_active_bonus": 0, "total_batches": 0}
    
    return {
        "batches": batches,
        "total": total,
        "summary": {
            "total_active_bonus_credits": summary.get("total_active_bonus", 0),
            "total_active_batches": summary.get("total_batches", 0),
            "expiry_policy_months": BONUS_CREDIT_EXPIRY_MONTHS
        }
    }
