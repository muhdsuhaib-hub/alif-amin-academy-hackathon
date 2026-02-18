"""
Tutor Earnings Wallet System for Alif Amin Academy

This module handles:
- Tutor earnings tracking (commission already deducted)
- Withdrawal request system
- Admin approval workflow
- Payout history

Key Principle: Commission is deducted BEFORE earnings are credited to tutor wallet.
Financial updates use MongoDB transactions for atomicity when available.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid
import logging

logger = logging.getLogger(__name__)

tutor_earnings_router = APIRouter(prefix="/api/tutor-earnings")

# Database and client will be injected from server.py
db = None
mongo_client = None

def init_tutor_earnings_routes(database, client=None):
    global db, mongo_client
    db = database
    mongo_client = client


# ============== REQUEST MODELS ==============

class WithdrawalRequestCreate(BaseModel):
    amount: float
    bank_name: str
    account_number: str
    account_holder_name: str


class WithdrawalRequestUpdate(BaseModel):
    status: str  # approved, rejected
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


# ============== HELPER FUNCTIONS ==============

async def get_or_create_tutor_earnings(teacher_id: str, user_id: str):
    """Get existing earnings wallet or create new one for tutor"""
    earnings = await db.tutor_earnings.find_one({"teacher_id": teacher_id}, {"_id": 0})
    
    if not earnings:
        earnings_id = f"earnings_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        earnings = {
            "earnings_id": earnings_id,
            "teacher_id": teacher_id,
            "user_id": user_id,
            "total_earnings": 0.0,
            "pending_earnings": 0.0,
            "withdrawable_balance": 0.0,
            "total_withdrawn": 0.0,
            "pending_withdrawal": 0.0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await db.tutor_earnings.insert_one(earnings)
    
    return earnings


async def add_earnings_transaction(
    earnings_id: str,
    teacher_id: str,
    transaction_type: str,
    amount: float,
    balance_after: float,
    description: str,
    reference_id: Optional[str] = None,
    session_payment_record_id: Optional[str] = None,
    gross_amount: float = 0.0,
    net_amount: float = 0.0,
    platform_fee: float = 0.0,
):
    """Add a transaction record to tutor earnings history"""
    transaction_id = f"te_txn_{uuid.uuid4().hex[:12]}"
    transaction = {
        "transaction_id": transaction_id,
        "earnings_id": earnings_id,
        "teacher_id": teacher_id,
        "transaction_type": transaction_type,
        "amount": amount,
        "gross_amount": gross_amount,
        "net_amount": net_amount,
        "platform_fee": platform_fee,
        "balance_after": balance_after,
        "description": description,
        "reference_id": reference_id,
        "session_payment_record_id": session_payment_record_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tutor_earnings_transactions.insert_one(transaction)
    return transaction_id


async def credit_tutor_earnings(
    teacher_id: str,
    user_id: str,
    amount: float,
    booking_id: str,
    session_payment_record_id: str,
    description: str,
    gross_amount: float = 0.0,
    platform_fee: float = 0.0,
):
    """
    Credit earnings to tutor wallet from a completed session.
    Amount should ALREADY have commission deducted (this is the tutor's net payout).
    
    Uses MongoDB transaction for atomicity:
    Teacher Wallet Credit + Admin Revenue Record + Transaction History + Stats Update
    all succeed or all fail together.
    """
    earnings = await get_or_create_tutor_earnings(teacher_id, user_id)
    
    new_total = earnings["total_earnings"] + amount
    new_withdrawable = earnings["withdrawable_balance"] + amount
    now_iso = datetime.now(timezone.utc).isoformat()

    transaction_id = f"te_txn_{uuid.uuid4().hex[:12]}"
    revenue_id = f"rev_{uuid.uuid4().hex[:12]}"

    async def _execute_writes(session=None):
        """Execute all financial writes, optionally within a MongoDB session."""
        # 1. Update tutor earnings wallet
        await db.tutor_earnings.update_one(
            {"teacher_id": teacher_id},
            {"$set": {
                "total_earnings": new_total,
                "withdrawable_balance": new_withdrawable,
                "updated_at": now_iso
            }},
            session=session
        )
        # 2. Increment teacher total_classes
        await db.teachers.update_one(
            {"teacher_id": teacher_id},
            {"$inc": {"total_classes": 1}},
            session=session
        )
        # 3. Record admin/platform revenue
        await db.admin_revenue.insert_one({
            "revenue_id": revenue_id,
            "teacher_id": teacher_id,
            "booking_id": booking_id,
            "gross_amount": gross_amount,
            "platform_fee": platform_fee,
            "net_to_teacher": amount,
            "created_at": now_iso,
        }, session=session)
        # 4. Record earnings transaction
        await db.tutor_earnings_transactions.insert_one({
            "transaction_id": transaction_id,
            "earnings_id": earnings["earnings_id"],
            "teacher_id": teacher_id,
            "transaction_type": "session_earning",
            "amount": amount,
            "gross_amount": gross_amount,
            "net_amount": amount,
            "platform_fee": platform_fee,
            "balance_after": new_withdrawable,
            "description": description,
            "reference_id": booking_id,
            "session_payment_record_id": session_payment_record_id,
            "created_at": now_iso
        }, session=session)

    # Try atomic transaction first; fall back to sequential writes
    if mongo_client:
        try:
            async with await mongo_client.start_session() as session:
                async with session.start_transaction():
                    await _execute_writes(session=session)
            logger.info(f"Atomic earnings credit for teacher {teacher_id}, booking {booking_id}")
        except Exception as tx_err:
            logger.warning(f"Transaction not supported, falling back to sequential writes: {tx_err}")
            await _execute_writes()
    else:
        await _execute_writes()
    
    return {
        "credited": amount,
        "new_withdrawable_balance": new_withdrawable,
        "total_earnings": new_total
    }


# ============== API ENDPOINTS ==============

@tutor_earnings_router.get("/balance")
async def get_tutor_earnings_balance(user_id: str):
    """Get tutor's earnings wallet balance"""
    # Get teacher record
    teacher = await db.teachers.find_one({"user_id": user_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    earnings = await get_or_create_tutor_earnings(teacher["teacher_id"], user_id)
    
    # Get commission info
    commission_rate = teacher.get("commission_rate", 0.30)
    tier_level = teacher.get("tier_level", "new")
    
    return {
        "earnings": earnings,
        "commission_info": {
            "tier_level": tier_level,
            "commission_rate": commission_rate,
            "tutor_rate": 1 - commission_rate
        }
    }


@tutor_earnings_router.get("/transactions")
async def get_tutor_transactions(user_id: str, limit: int = 50, offset: int = 0):
    """Get tutor's earnings transaction history"""
    teacher = await db.teachers.find_one({"user_id": user_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    transactions = await db.tutor_earnings_transactions.find(
        {"teacher_id": teacher["teacher_id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.tutor_earnings_transactions.count_documents({"teacher_id": teacher["teacher_id"]})
    
    return {
        "transactions": transactions,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@tutor_earnings_router.post("/withdraw")
async def create_withdrawal_request(request: WithdrawalRequestCreate, user_id: str):
    """Create a withdrawal request"""
    teacher = await db.teachers.find_one({"user_id": user_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    earnings = await get_or_create_tutor_earnings(teacher["teacher_id"], user_id)
    
    # Validate amount
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    if request.amount > earnings["withdrawable_balance"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient balance. Available: RM {earnings['withdrawable_balance']:.2f}"
        )
    
    # Check for existing pending withdrawal
    existing_pending = await db.withdrawal_requests.find_one({
        "teacher_id": teacher["teacher_id"],
        "status": {"$in": ["pending", "processing"]}
    })
    if existing_pending:
        raise HTTPException(
            status_code=400, 
            detail="You already have a pending withdrawal request. Please wait for it to be processed."
        )
    
    # Create withdrawal request
    withdrawal_id = f"wd_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    withdrawal = {
        "withdrawal_id": withdrawal_id,
        "teacher_id": teacher["teacher_id"],
        "user_id": user_id,
        "amount": request.amount,
        "bank_name": request.bank_name,
        "account_number": request.account_number,
        "account_holder_name": request.account_holder_name,
        "status": "pending",
        "admin_notes": None,
        "rejection_reason": None,
        "processed_by": None,
        "processed_at": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    await db.withdrawal_requests.insert_one(withdrawal)
    
    # Update earnings - move to pending_withdrawal
    new_withdrawable = earnings["withdrawable_balance"] - request.amount
    new_pending_withdrawal = earnings["pending_withdrawal"] + request.amount
    
    await db.tutor_earnings.update_one(
        {"teacher_id": teacher["teacher_id"]},
        {"$set": {
            "withdrawable_balance": new_withdrawable,
            "pending_withdrawal": new_pending_withdrawal,
            "updated_at": now.isoformat()
        }}
    )
    
    # Add transaction record
    await add_earnings_transaction(
        earnings_id=earnings["earnings_id"],
        teacher_id=teacher["teacher_id"],
        transaction_type="withdrawal_request",
        amount=-request.amount,
        balance_after=new_withdrawable,
        description=f"Withdrawal request to {request.bank_name} - {request.account_number}",
        reference_id=withdrawal_id
    )
    
    return {
        "success": True,
        "withdrawal_id": withdrawal_id,
        "amount": request.amount,
        "new_withdrawable_balance": new_withdrawable,
        "message": "Withdrawal request submitted. You will be notified once it's processed."
    }


@tutor_earnings_router.get("/withdrawals")
async def get_withdrawal_history(user_id: str, limit: int = 20, offset: int = 0):
    """Get tutor's withdrawal request history"""
    teacher = await db.teachers.find_one({"user_id": user_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    withdrawals = await db.withdrawal_requests.find(
        {"teacher_id": teacher["teacher_id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    total = await db.withdrawal_requests.count_documents({"teacher_id": teacher["teacher_id"]})
    
    return {
        "withdrawals": withdrawals,
        "total": total,
        "limit": limit,
        "offset": offset
    }


# ============== ADMIN ENDPOINTS ==============

@tutor_earnings_router.get("/admin/pending-withdrawals")
async def get_pending_withdrawals():
    """Admin: Get all pending withdrawal requests"""
    withdrawals = await db.withdrawal_requests.find(
        {"status": {"$in": ["pending", "processing"]}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Enrich with tutor info
    for withdrawal in withdrawals:
        teacher = await db.teachers.find_one({"teacher_id": withdrawal["teacher_id"]}, {"_id": 0})
        user = await db.users.find_one({"user_id": withdrawal["user_id"]}, {"_id": 0})
        withdrawal["teacher_info"] = {
            "name": user.get("name") if user else "Unknown",
            "email": user.get("email") if user else "",
            "tier_level": teacher.get("tier_level", "new") if teacher else "new"
        }
    
    return {
        "pending_withdrawals": withdrawals,
        "total": len(withdrawals)
    }


@tutor_earnings_router.get("/admin/all-withdrawals")
async def get_all_withdrawals(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Admin: Get all withdrawal requests with optional status filter"""
    query = {}
    if status:
        query["status"] = status
    
    withdrawals = await db.withdrawal_requests.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    # Enrich with tutor info
    for withdrawal in withdrawals:
        teacher = await db.teachers.find_one({"teacher_id": withdrawal["teacher_id"]}, {"_id": 0})
        user = await db.users.find_one({"user_id": withdrawal["user_id"]}, {"_id": 0})
        withdrawal["teacher_info"] = {
            "name": user.get("name") if user else "Unknown",
            "email": user.get("email") if user else "",
            "tier_level": teacher.get("tier_level", "new") if teacher else "new"
        }
    
    total = await db.withdrawal_requests.count_documents(query)
    
    return {
        "withdrawals": withdrawals,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@tutor_earnings_router.post("/admin/withdrawals/{withdrawal_id}/process")
async def process_withdrawal(withdrawal_id: str, update: WithdrawalRequestUpdate, admin_user_id: str):
    """Admin: Approve or reject a withdrawal request"""
    withdrawal = await db.withdrawal_requests.find_one({"withdrawal_id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    
    if withdrawal["status"] not in ["pending", "processing"]:
        raise HTTPException(status_code=400, detail=f"Cannot process withdrawal with status: {withdrawal['status']}")
    
    now = datetime.now(timezone.utc)
    
    # Get tutor earnings
    earnings = await db.tutor_earnings.find_one({"teacher_id": withdrawal["teacher_id"]}, {"_id": 0})
    if not earnings:
        raise HTTPException(status_code=404, detail="Tutor earnings record not found")
    
    if update.status == "approved":
        # Mark as completed (in real app, this would trigger actual payment)
        await db.withdrawal_requests.update_one(
            {"withdrawal_id": withdrawal_id},
            {"$set": {
                "status": "completed",
                "admin_notes": update.admin_notes,
                "processed_by": admin_user_id,
                "processed_at": now.isoformat(),
                "updated_at": now.isoformat()
            }}
        )
        
        # Update earnings - move from pending_withdrawal to total_withdrawn
        new_pending_withdrawal = earnings["pending_withdrawal"] - withdrawal["amount"]
        new_total_withdrawn = earnings["total_withdrawn"] + withdrawal["amount"]
        
        await db.tutor_earnings.update_one(
            {"teacher_id": withdrawal["teacher_id"]},
            {"$set": {
                "pending_withdrawal": new_pending_withdrawal,
                "total_withdrawn": new_total_withdrawn,
                "updated_at": now.isoformat()
            }}
        )
        
        # Add transaction record
        await add_earnings_transaction(
            earnings_id=earnings["earnings_id"],
            teacher_id=withdrawal["teacher_id"],
            transaction_type="withdrawal_approved",
            amount=0,  # No change to withdrawable balance
            balance_after=earnings["withdrawable_balance"],
            description=f"Withdrawal approved and paid to {withdrawal['bank_name']} - {withdrawal['account_number']}",
            reference_id=withdrawal_id
        )
        
        return {
            "success": True,
            "message": "Withdrawal approved and marked as paid",
            "withdrawal_id": withdrawal_id,
            "amount": withdrawal["amount"]
        }
    
    elif update.status == "rejected":
        if not update.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required")
        
        # Mark as rejected
        await db.withdrawal_requests.update_one(
            {"withdrawal_id": withdrawal_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": update.rejection_reason,
                "admin_notes": update.admin_notes,
                "processed_by": admin_user_id,
                "processed_at": now.isoformat(),
                "updated_at": now.isoformat()
            }}
        )
        
        # Return funds to withdrawable balance
        new_withdrawable = earnings["withdrawable_balance"] + withdrawal["amount"]
        new_pending_withdrawal = earnings["pending_withdrawal"] - withdrawal["amount"]
        
        await db.tutor_earnings.update_one(
            {"teacher_id": withdrawal["teacher_id"]},
            {"$set": {
                "withdrawable_balance": new_withdrawable,
                "pending_withdrawal": new_pending_withdrawal,
                "updated_at": now.isoformat()
            }}
        )
        
        # Add transaction record
        await add_earnings_transaction(
            earnings_id=earnings["earnings_id"],
            teacher_id=withdrawal["teacher_id"],
            transaction_type="withdrawal_rejected",
            amount=withdrawal["amount"],
            balance_after=new_withdrawable,
            description=f"Withdrawal rejected: {update.rejection_reason}",
            reference_id=withdrawal_id
        )
        
        return {
            "success": True,
            "message": "Withdrawal rejected, funds returned to tutor balance",
            "withdrawal_id": withdrawal_id,
            "amount": withdrawal["amount"],
            "new_withdrawable_balance": new_withdrawable
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'approved' or 'rejected'")


@tutor_earnings_router.get("/admin/commission-earned")
async def get_total_commission_earned():
    """Admin: Get total platform commission earned from all completed sessions"""
    pipeline = [
        {"$group": {
            "_id": None,
            "total_sessions": {"$sum": 1},
            "total_commission": {"$sum": "$platform_commission"},
            "total_tutor_payouts": {"$sum": "$tutor_payout"},
            "total_session_value": {"$sum": "$base_session_price"}
        }}
    ]
    
    result = await db.session_payment_records.aggregate(pipeline).to_list(1)
    stats = result[0] if result else {
        "total_sessions": 0,
        "total_commission": 0,
        "total_tutor_payouts": 0,
        "total_session_value": 0
    }
    
    # Get withdrawal stats
    withdrawal_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": None,
            "total_withdrawn": {"$sum": "$amount"},
            "total_withdrawals": {"$sum": 1}
        }}
    ]
    withdrawal_result = await db.withdrawal_requests.aggregate(withdrawal_pipeline).to_list(1)
    withdrawal_stats = withdrawal_result[0] if withdrawal_result else {"total_withdrawn": 0, "total_withdrawals": 0}
    
    # Get pending withdrawal totals
    pending_pipeline = [
        {"$match": {"status": {"$in": ["pending", "processing"]}}},
        {"$group": {
            "_id": None,
            "pending_amount": {"$sum": "$amount"},
            "pending_count": {"$sum": 1}
        }}
    ]
    pending_result = await db.withdrawal_requests.aggregate(pending_pipeline).to_list(1)
    pending_stats = pending_result[0] if pending_result else {"pending_amount": 0, "pending_count": 0}
    
    return {
        "commission_earned": {
            "total_platform_commission": stats.get("total_commission", 0),
            "total_sessions_completed": stats.get("total_sessions", 0),
            "total_session_value": stats.get("total_session_value", 0),
            "total_tutor_payouts_owed": stats.get("total_tutor_payouts", 0)
        },
        "withdrawals": {
            "total_withdrawn": withdrawal_stats.get("total_withdrawn", 0),
            "total_withdrawal_count": withdrawal_stats.get("total_withdrawals", 0),
            "pending_withdrawal_amount": pending_stats.get("pending_amount", 0),
            "pending_withdrawal_count": pending_stats.get("pending_count", 0),
            "outstanding_tutor_balance": stats.get("total_tutor_payouts", 0) - withdrawal_stats.get("total_withdrawn", 0)
        }
    }


@tutor_earnings_router.get("/admin/tutor/{teacher_id}/earnings")
async def get_tutor_earnings_admin(teacher_id: str):
    """Admin: Get earnings details for a specific tutor"""
    earnings = await db.tutor_earnings.find_one({"teacher_id": teacher_id}, {"_id": 0})
    if not earnings:
        # Try to get teacher and create earnings
        teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        earnings = await get_or_create_tutor_earnings(teacher_id, teacher["user_id"])
    
    # Get teacher and user info
    teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
    user = await db.users.find_one({"user_id": earnings["user_id"]}, {"_id": 0}) if earnings else None
    
    # Get recent transactions
    transactions = await db.tutor_earnings_transactions.find(
        {"teacher_id": teacher_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Get withdrawal history
    withdrawals = await db.withdrawal_requests.find(
        {"teacher_id": teacher_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "teacher_info": {
            "teacher_id": teacher_id,
            "name": user.get("name") if user else "Unknown",
            "email": user.get("email") if user else "",
            "tier_level": teacher.get("tier_level", "new") if teacher else "new",
            "commission_rate": teacher.get("commission_rate", 0.30) if teacher else 0.30
        },
        "earnings": earnings,
        "recent_transactions": transactions,
        "recent_withdrawals": withdrawals
    }
