from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from datetime import datetime, timezone, timedelta
import uuid
import os
from typing import Optional, List
from pydantic import BaseModel
from models import User, Teacher, Student

admin_router = APIRouter(prefix="/api/admin")

# Database will be injected from server.py
db = None
get_current_user = None

def init_admin_routes(database, auth_dependency=None):
    global db, get_current_user
    db = database
    get_current_user = auth_dependency


async def require_admin():
    """Dependency that requires admin role"""
    if get_current_user is None:
        raise HTTPException(status_code=500, detail="Auth not configured")
    return get_current_user


class SupportTicket(BaseModel):
    ticket_id: Optional[str] = None
    user_id: str
    user_name: str
    user_email: str
    subject: str
    description: str
    priority: str = "medium"
    status: str = "open"
    created_at: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    student_id: str
    action: str  # pause, resume, cancel, extend_trial
    discount_percentage: Optional[float] = None


class ManualBooking(BaseModel):
    student_id: str
    teacher_id: str
    start_time_utc: str
    duration_minutes: int = 60
    booking_type: str = "paid"
    notes: Optional[str] = None


# User Management Endpoints
@admin_router.get("/users/all")
async def get_all_users(
    role: Optional[str] = None, 
    search: Optional[str] = None, 
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1, 
    limit: int = 20
):
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    if date_from:
        query["created_at"] = {"$gte": date_from}
    if date_to:
        if "created_at" in query:
            query["created_at"]["$lte"] = date_to
        else:
            query["created_at"] = {"$lte": date_to}
    
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    # Enrich with additional data
    for user in users:
        if user.get("role") == "student":
            student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
            if student:
                user["student_info"] = student
                # Add student-specific fields to the user object for easier export
                user["subscription_status"] = student.get("subscription_status")
                user["current_level"] = student.get("current_level")
                user["schedule_preference"] = student.get("schedule_preference") or user.get("schedule_preference")
                user["reading_level"] = student.get("reading_level") or user.get("reading_level")
        elif user.get("role") == "teacher":
            teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
            if teacher:
                user["teacher_info"] = teacher
                # Add teacher-specific fields
                user["teacher_status"] = teacher.get("approval_status")
                user["specializations"] = teacher.get("specializations")
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@admin_router.put("/users/{user_id}")
async def update_user(user_id: str, updates: dict):
    allowed_fields = ["name", "email", "role", "phone", "timezone"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}


@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    # Delete user and related data
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.students.delete_many({"user_id": user_id})
    await db.teachers.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}


# Teacher Approval Endpoints
@admin_router.get("/teachers/pending")
async def get_pending_teachers():
    """Get all teachers pending approval"""
    pending_teachers = await db.teachers.find(
        {"$or": [{"approval_status": "pending"}, {"is_active": False}]},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with user data
    for teacher in pending_teachers:
        user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
        if user:
            teacher["user"] = user
    
    return {"pending_teachers": pending_teachers}


@admin_router.post("/teachers/{teacher_id}/approve")
async def approve_teacher(teacher_id: str):
    """Approve a pending teacher"""
    teacher = await db.teachers.find_one({"teacher_id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Update teacher status
    await db.teachers.update_one(
        {"teacher_id": teacher_id},
        {"$set": {
            "is_active": True,
            "approval_status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Teacher approved successfully", "teacher_id": teacher_id}


@admin_router.post("/teachers/{teacher_id}/reject")
async def reject_teacher(teacher_id: str, reason: Optional[str] = None):
    """Reject a pending teacher application"""
    teacher = await db.teachers.find_one({"teacher_id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Update teacher status
    await db.teachers.update_one(
        {"teacher_id": teacher_id},
        {"$set": {
            "is_active": False,
            "approval_status": "rejected",
            "rejection_reason": reason,
            "rejected_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Optionally revert user role back to student
    await db.users.update_one(
        {"user_id": teacher["user_id"]},
        {"$set": {"role": "student"}}
    )
    
    return {"message": "Teacher application rejected", "teacher_id": teacher_id}


# Master Calendar Endpoints
@admin_router.get("/calendar/bookings")
async def get_calendar_bookings(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    teacher_id: Optional[str] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    
    if start_date:
        query["start_time_utc"] = {"$gte": start_date}
    if end_date:
        if "start_time_utc" in query:
            query["start_time_utc"]["$lte"] = end_date
        else:
            query["start_time_utc"] = {"$lte": end_date}
    if teacher_id:
        query["teacher_id"] = teacher_id
    if student_id:
        query["student_id"] = student_id
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("start_time_utc", 1).to_list(500)
    
    # Enrich with user and teacher data
    for booking in bookings:
        student = await db.students.find_one({"student_id": booking["student_id"]}, {"_id": 0})
        teacher = await db.teachers.find_one({"teacher_id": booking["teacher_id"]}, {"_id": 0})
        
        if student:
            student_user = await db.users.find_one({"user_id": student["user_id"]}, {"_id": 0})
            booking["student"] = {**student, "user": student_user}
        
        if teacher:
            teacher_user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
            booking["teacher"] = {**teacher, "user": teacher_user}
    
    return bookings


@admin_router.post("/calendar/manual-booking")
async def create_manual_booking(booking: ManualBooking):
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"

    # Validate teacher
    teacher = await db.teachers.find_one({"teacher_id": booking.teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Validate student
    student = await db.students.find_one({"student_id": booking.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Parse start time with timezone awareness
    start_time = datetime.fromisoformat(booking.start_time_utc.replace("Z", "+00:00"))
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    end_time = start_time + timedelta(minutes=booking.duration_minutes)

    # Get teacher name
    teacher_user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
    teacher_name = teacher_user.get("name", "Unknown") if teacher_user else "Unknown"

    now_iso = datetime.now(timezone.utc).isoformat()

    # Create booking record (mirrors student booking flow exactly)
    booking_doc = {
        "booking_id": booking_id,
        "student_id": booking.student_id,
        "teacher_id": booking.teacher_id,
        "start_time_utc": start_time.isoformat(),
        "end_time_utc": end_time.isoformat(),
        "duration_minutes": booking.duration_minutes,
        "credits_charged": 0,
        "paid_credits_charged": 0,
        "bonus_credits_charged": 0,
        "status": "scheduled",
        "booking_type": booking.booking_type,
        "teacher_name": teacher_name,
        "notes": booking.notes,
        "created_at": now_iso,
        "created_by": "admin"
    }
    await db.bookings.insert_one(booking_doc)

    # Create class_sessions record (critical for dashboard join button)
    session_id = f"cs_{uuid.uuid4().hex[:12]}"
    meet_link_slug = str(uuid.uuid4())
    await db.class_sessions.insert_one({
        "session_id": session_id,
        "teacher_id": booking.teacher_id,
        "student_id": booking.student_id,
        "booking_id": booking_id,
        "slot_id": None,
        "start_time_utc": start_time.isoformat(),
        "end_time_utc": end_time.isoformat(),
        "status": "booked",
        "meet_link_slug": meet_link_slug,
        "recording_url": None,
        "recording_visibility": "hidden",
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    return {
        "message": "Manual booking created",
        "booking_id": booking_id,
        "session_id": session_id,
        "meet_link_slug": meet_link_slug,
    }


@admin_router.delete("/calendar/bookings/{booking_id}")
async def cancel_booking_admin(booking_id: str, reason: Optional[str] = None):
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {
            "$set": {
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc).isoformat(),
                "cancellation_reason": reason or "Admin cancellation"
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Free up the availability slot
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if booking:
        await db.availability_slots.update_one(
            {"teacher_id": booking["teacher_id"], "start_time_utc": booking["start_time_utc"]},
            {"$set": {"is_booked": False}}
        )
    
    return {"message": "Booking cancelled successfully"}


# Financial Reports
@admin_router.get("/finance/revenue")
async def get_revenue_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    if not start_date:
        start_date = month_start.isoformat()
    if not end_date:
        end_date = datetime.now(timezone.utc).isoformat()
    
    # Get completed bookings in date range
    completed_bookings = await db.bookings.find({
        "status": "completed",
        "start_time_utc": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(1000)
    
    # Calculate revenue
    total_revenue = 0
    trial_classes = 0
    paid_classes = 0
    
    for booking in completed_bookings:
        if booking.get("booking_type") == "trial":
            trial_classes += 1
        else:
            paid_classes += 1
            # Use platform standard credit pricing (RM15 per credit, 4 credits per hour)
            total_revenue += 60  # Standard 1-hour session value (4 credits × RM15)
    
    # Get active subscriptions
    active_subscriptions = await db.students.count_documents({"subscription_status": "active"})
    
    # Calculate MRR (Monthly Recurring Revenue)
    mrr = active_subscriptions * 320  # Assuming avg RM 320/month per student
    
    return {
        "total_revenue": total_revenue,
        "mrr": mrr,
        "paid_classes": paid_classes,
        "trial_classes": trial_classes,
        "total_classes": paid_classes + trial_classes,
        "active_subscriptions": active_subscriptions,
        "period": {
            "start": start_date,
            "end": end_date
        }
    }


@admin_router.get("/finance/payroll")
async def get_payroll_report(month: Optional[int] = None, year: Optional[int] = None):
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year
    
    # Calculate month boundaries
    month_start = datetime(target_year, target_month, 1, tzinfo=timezone.utc)
    if target_month == 12:
        month_end = datetime(target_year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(target_year, target_month + 1, 1, tzinfo=timezone.utc)
    
    # Get all teachers
    teachers = await db.teachers.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    payroll_data = []
    total_payroll = 0
    
    for teacher in teachers:
        # Count completed classes
        completed_classes = await db.bookings.count_documents({
            "teacher_id": teacher["teacher_id"],
            "status": "completed",
            "start_time_utc": {
                "$gte": month_start.isoformat(),
                "$lt": month_end.isoformat()
            }
        })
        
        # Calculate payment from session payment records (actual tutor payouts)
        payment_pipeline = [
            {"$match": {
                "teacher_id": teacher["teacher_id"],
                "created_at": {"$gte": month_start.isoformat(), "$lt": month_end.isoformat()}
            }},
            {"$group": {
                "_id": None,
                "total_payout": {"$sum": "$tutor_payout"}
            }}
        ]
        payment_result = await db.session_payment_records.aggregate(payment_pipeline).to_list(1)
        payment = payment_result[0]["total_payout"] if payment_result else 0
        total_payroll += payment
        
        # Get teacher user info
        user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
        
        payroll_data.append({
            "teacher_id": teacher["teacher_id"],
            "teacher_name": user.get("name") if user else "Unknown",
            "email": user.get("email") if user else "",
            "commission_tier": teacher.get("tier_level", "new"),
            "completed_classes": completed_classes,
            "payment_due": payment
        })
    
    return {
        "month": target_month,
        "year": target_year,
        "total_payroll": total_payroll,
        "teacher_count": len(teachers),
        "payroll_details": payroll_data
    }


# Support Tickets
@admin_router.get("/support/tickets")
async def get_support_tickets(status: Optional[str] = None, priority: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    tickets = await db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tickets


@admin_router.post("/support/tickets")
async def create_support_ticket(ticket: SupportTicket):
    ticket_id = f"ticket_{uuid.uuid4().hex[:12]}"
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "user_id": ticket.user_id,
        "user_name": ticket.user_name,
        "user_email": ticket.user_email,
        "subject": ticket.subject,
        "description": ticket.description,
        "priority": ticket.priority,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_tickets.insert_one(ticket_doc)
    
    return {"message": "Support ticket created", "ticket_id": ticket_id}


@admin_router.put("/support/tickets/{ticket_id}")
async def update_support_ticket(ticket_id: str, updates: dict):
    allowed_fields = ["status", "priority", "response", "assigned_to"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.support_tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"message": "Ticket updated successfully"}


# Subscription Management
@admin_router.post("/subscriptions/manage")
async def manage_subscription(sub_update: SubscriptionUpdate):
    student = await db.students.find_one({"student_id": sub_update.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = {}
    
    if sub_update.action == "pause":
        update_data = {
            "subscription_status": "paused",
            "paused_at": datetime.now(timezone.utc).isoformat()
        }
    elif sub_update.action == "resume":
        update_data = {
            "subscription_status": "active",
            "resumed_at": datetime.now(timezone.utc).isoformat()
        }
    elif sub_update.action == "cancel":
        update_data = {
            "subscription_status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }
    elif sub_update.action == "extend_trial":
        # Extend trial by 7 days
        current_end = datetime.now(timezone.utc) + timedelta(days=7)
        update_data = {
            "subscription_status": "trial",
            "trial_end_date": current_end.isoformat()
        }
    
    if sub_update.discount_percentage:
        update_data["discount_percentage"] = sub_update.discount_percentage
    
    await db.students.update_one(
        {"student_id": sub_update.student_id},
        {"$set": update_data}
    )
    
    return {"message": f"Subscription {sub_update.action} successful"}


@admin_router.get("/subscriptions/overview")
async def get_subscriptions_overview(request: Request, session_token: Optional[str] = Cookie(None)):
    if get_current_user:
        user = await get_current_user(request, session_token)
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
    active = await db.students.count_documents({"subscription_status": "active"})
    trial = await db.students.count_documents({"subscription_status": "trial"})
    paused = await db.students.count_documents({"subscription_status": "paused"})
    cancelled = await db.students.count_documents({"subscription_status": "cancelled"})
    
    # Get trial students ending soon (within 3 days)
    three_days_later = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    trials_expiring = await db.students.find({
        "subscription_status": "trial",
        "trial_end_date": {"$lte": three_days_later}
    }, {"_id": 0}).to_list(50)
    
    # Enrich with student names from users collection
    for student in trials_expiring:
        user = await db.users.find_one({"user_id": student.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        if user:
            student["student_name"] = user.get("name", "Unknown")
            student["student_email"] = user.get("email", "")
    
    return {
        "active_subscriptions": active,
        "trial_subscriptions": trial,
        "paused_subscriptions": paused,
        "cancelled_subscriptions": cancelled,
        "trials_expiring_soon": trials_expiring
    }


# Missed Classes Report
@admin_router.get("/reports/missed-classes")
async def get_missed_classes_report():
    # Get no-show bookings
    missed_classes = await db.bookings.find({
        "status": "no_show"
    }, {"_id": 0}).sort("start_time_utc", -1).to_list(100)
    
    # Enrich with user data
    for booking in missed_classes:
        student = await db.students.find_one({"student_id": booking["student_id"]}, {"_id": 0})
        teacher = await db.teachers.find_one({"teacher_id": booking["teacher_id"]}, {"_id": 0})
        
        if student:
            student_user = await db.users.find_one({"user_id": student["user_id"]}, {"_id": 0})
            booking["student"] = {**student, "user": student_user}
        
        if teacher:
            teacher_user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
            booking["teacher"] = {**teacher, "user": teacher_user}
    
    return missed_classes


# Wallet Credit Liability Report
@admin_router.get("/wallet/liability")
async def get_wallet_credit_liability():
    """
    Get outstanding wallet credit liability for financial reporting.
    Returns:
    - Total paid credits outstanding (real money obligation)
    - Total bonus credits outstanding (marketing liability)
    - Estimated future tutor payout exposure
    """
    # Base session prices for payout calculation
    # 1 credit = 15 mins = RM15, so 1 credit = RM15 base value
    BASE_CREDIT_PRICE = 15.0
    COMMISSION_RATE = 0.20  # 20% platform commission
    TUTOR_PAYOUT_RATE = 1 - COMMISSION_RATE  # 80% to tutors
    
    # Aggregate total paid and bonus credits across all wallets
    wallet_pipeline = [
        {"$group": {
            "_id": None,
            "total_paid_credits": {"$sum": "$paid_credits"},
            "total_bonus_credits": {"$sum": "$bonus_credits"},
            "total_credit_balance": {"$sum": "$credit_balance"},
            "total_wallets": {"$sum": 1},
            "total_topup_amount": {"$sum": "$total_topup_amount"},
            "total_credits_used": {"$sum": "$total_credits_used"}
        }}
    ]
    
    wallet_result = await db.student_wallets.aggregate(wallet_pipeline).to_list(1)
    wallet_stats = wallet_result[0] if wallet_result else {
        "total_paid_credits": 0,
        "total_bonus_credits": 0,
        "total_credit_balance": 0,
        "total_wallets": 0,
        "total_topup_amount": 0,
        "total_credits_used": 0
    }
    
    total_paid = wallet_stats.get("total_paid_credits", 0) or 0
    total_bonus = wallet_stats.get("total_bonus_credits", 0) or 0
    total_credits = total_paid + total_bonus
    
    # Calculate financial exposure
    # Paid credits = real money obligation (tutor payout when used)
    # Each credit represents a potential RM15 session value
    paid_credits_value = total_paid * BASE_CREDIT_PRICE
    bonus_credits_value = total_bonus * BASE_CREDIT_PRICE  # Marketing cost if used
    
    # Estimated tutor payout = credit value × tutor payout rate (80%)
    estimated_tutor_payout_paid = paid_credits_value * TUTOR_PAYOUT_RATE
    estimated_tutor_payout_bonus = bonus_credits_value * TUTOR_PAYOUT_RATE
    total_tutor_payout_exposure = estimated_tutor_payout_paid + estimated_tutor_payout_bonus
    
    # Platform commission exposure
    platform_commission_exposure = (paid_credits_value + bonus_credits_value) * COMMISSION_RATE
    
    # Get count of wallets with balance > 0
    active_wallets = await db.student_wallets.count_documents({"credit_balance": {"$gt": 0}})
    
    # Get bonus credit expiry summary
    expiry_pipeline = [
        {"$match": {"is_expired": False, "remaining_credits": {"$gt": 0}}},
        {"$group": {
            "_id": None,
            "total_active_bonus_batches": {"$sum": 1},
            "total_bonus_in_batches": {"$sum": "$remaining_credits"}
        }}
    ]
    expiry_result = await db.bonus_credit_batches.aggregate(expiry_pipeline).to_list(1)
    expiry_stats = expiry_result[0] if expiry_result else {
        "total_active_bonus_batches": 0,
        "total_bonus_in_batches": 0
    }
    
    # Get already used session payment records for comparison
    session_pipeline = [
        {"$group": {
            "_id": None,
            "total_sessions": {"$sum": 1},
            "total_tutor_payouts": {"$sum": "$tutor_payout"},
            "total_platform_commission": {"$sum": "$platform_commission"},
            "total_marketing_cost_realized": {"$sum": "$platform_marketing_cost"},
            "total_paid_credits_used": {"$sum": "$paid_credits_used"},
            "total_bonus_credits_used": {"$sum": "$bonus_credits_used"}
        }}
    ]
    session_result = await db.session_payment_records.aggregate(session_pipeline).to_list(1)
    session_stats = session_result[0] if session_result else {
        "total_sessions": 0,
        "total_tutor_payouts": 0,
        "total_platform_commission": 0,
        "total_marketing_cost_realized": 0,
        "total_paid_credits_used": 0,
        "total_bonus_credits_used": 0
    }
    
    return {
        "credit_liability": {
            "total_paid_credits_outstanding": total_paid,
            "total_bonus_credits_outstanding": total_bonus,
            "total_credits_outstanding": total_credits,
            "paid_credits_monetary_value": paid_credits_value,
            "bonus_credits_monetary_value": bonus_credits_value,
            "total_monetary_value": paid_credits_value + bonus_credits_value
        },
        "tutor_payout_exposure": {
            "from_paid_credits": estimated_tutor_payout_paid,
            "from_bonus_credits": estimated_tutor_payout_bonus,
            "total_exposure": total_tutor_payout_exposure,
            "payout_rate": TUTOR_PAYOUT_RATE,
            "note": "Amount owed to tutors if all outstanding credits are used"
        },
        "platform_commission": {
            "potential_commission": platform_commission_exposure,
            "commission_rate": COMMISSION_RATE
        },
        "marketing_liability": {
            "bonus_credits_value": bonus_credits_value,
            "active_bonus_batches": expiry_stats.get("total_active_bonus_batches", 0),
            "note": "Cost absorbed by platform when bonus credits are used"
        },
        "wallet_summary": {
            "total_wallets": wallet_stats.get("total_wallets", 0),
            "wallets_with_balance": active_wallets,
            "total_topup_revenue": wallet_stats.get("total_topup_amount", 0),
            "total_credits_used_all_time": wallet_stats.get("total_credits_used", 0)
        },
        "historical_usage": {
            "total_sessions_completed": session_stats.get("total_sessions", 0),
            "total_tutor_payouts_made": session_stats.get("total_tutor_payouts", 0),
            "total_platform_commission_earned": session_stats.get("total_platform_commission", 0),
            "total_marketing_cost_realized": session_stats.get("total_marketing_cost_realized", 0),
            "paid_credits_used": session_stats.get("total_paid_credits_used", 0),
            "bonus_credits_used": session_stats.get("total_bonus_credits_used", 0)
        },
        "base_rates": {
            "credit_price": BASE_CREDIT_PRICE,
            "commission_rate": COMMISSION_RATE,
            "tutor_rate": TUTOR_PAYOUT_RATE
        }
    }


# Revenue Recognition Report
@admin_router.get("/revenue/recognition")
async def get_revenue_recognition(request: Request, session_token: Optional[str] = Cookie(None)):
    """
    Get revenue recognition data following proper accounting principles.
    
    Key Principle: Commission revenue is ONLY recognized when sessions are completed,
    not when credits are purchased (cash collected ≠ revenue earned).
    
    Returns:
    - Cash Collected: Total money received from top-ups (deferred revenue)
    - Platform Commission Earned: Commission from completed sessions only
    - Tutor Payable Amount: Amount owed to tutors from completed sessions
    - Deferred Revenue: Cash collected but not yet earned
    """
    if get_current_user:
        user = await get_current_user(request, session_token)
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
    
    from datetime import datetime, timezone, timedelta
    
    BASE_CREDIT_PRICE = 15.0
    COMMISSION_RATE = 0.20  # 20% platform commission
    TUTOR_PAYOUT_RATE = 0.80  # 80% to tutors
    
    # ============== CASH COLLECTED ==============
    # Total money received from all top-ups (this is deferred revenue until sessions completed)
    topup_pipeline = [
        {"$match": {"transaction_type": "topup_paid"}},
        {"$group": {
            "_id": None,
            "total_cash_collected": {"$sum": "$payment_amount"},
            "total_transactions": {"$sum": 1}
        }}
    ]
    topup_result = await db.wallet_transactions.aggregate(topup_pipeline).to_list(1)
    topup_stats = topup_result[0] if topup_result else {"total_cash_collected": 0, "total_transactions": 0}
    
    # Also get from wallet summary as backup
    wallet_pipeline = [
        {"$group": {
            "_id": None,
            "total_topup_amount": {"$sum": "$total_topup_amount"}
        }}
    ]
    wallet_result = await db.student_wallets.aggregate(wallet_pipeline).to_list(1)
    wallet_stats = wallet_result[0] if wallet_result else {"total_topup_amount": 0}
    
    # Use the larger value (wallet tracking is more reliable)
    cash_collected = max(
        topup_stats.get("total_cash_collected", 0) or 0,
        wallet_stats.get("total_topup_amount", 0) or 0
    )
    
    # ============== REVENUE FROM COMPLETED SESSIONS ==============
    # Commission is ONLY recognized when session is completed
    session_pipeline = [
        {"$group": {
            "_id": None,
            "total_sessions": {"$sum": 1},
            "total_base_session_value": {"$sum": "$base_session_price"},
            "total_commission_earned": {"$sum": "$platform_commission"},
            "total_tutor_payable": {"$sum": "$tutor_payout"},
            "total_marketing_cost": {"$sum": "$platform_marketing_cost"},
            "total_credits_used": {"$sum": "$credits_used"},
            "total_paid_credits_used": {"$sum": "$paid_credits_used"},
            "total_bonus_credits_used": {"$sum": "$bonus_credits_used"}
        }}
    ]
    session_result = await db.session_payment_records.aggregate(session_pipeline).to_list(1)
    session_stats = session_result[0] if session_result else {
        "total_sessions": 0,
        "total_base_session_value": 0,
        "total_commission_earned": 0,
        "total_tutor_payable": 0,
        "total_marketing_cost": 0,
        "total_credits_used": 0,
        "total_paid_credits_used": 0,
        "total_bonus_credits_used": 0
    }
    
    commission_earned = session_stats.get("total_commission_earned", 0) or 0
    tutor_payable = session_stats.get("total_tutor_payable", 0) or 0
    marketing_cost_realized = session_stats.get("total_marketing_cost", 0) or 0
    
    # ============== TUTOR PAYMENT STATUS ==============
    # Track what's been paid vs what's pending
    # For now, assume all tutor payouts are pending until withdrawal
    tutor_paid_pipeline = [
        {"$match": {"transaction_type": "withdrawal", "status": "completed"}},
        {"$group": {
            "_id": None,
            "total_paid": {"$sum": "$amount"}
        }}
    ]
    tutor_paid_result = await db.teacher_transactions.aggregate(tutor_paid_pipeline).to_list(1)
    tutor_paid = tutor_paid_result[0].get("total_paid", 0) if tutor_paid_result else 0
    tutor_pending = tutor_payable - tutor_paid
    
    # ============== DEFERRED REVENUE CALCULATION ==============
    # Deferred Revenue = Cash Collected - Revenue Recognized
    # Revenue Recognized = Commission Earned + Tutor Payable (from completed sessions)
    revenue_recognized = commission_earned + tutor_payable
    deferred_revenue = cash_collected - revenue_recognized
    
    # ============== OUTSTANDING CREDITS VALUE ==============
    # Calculate potential future revenue from outstanding credits
    outstanding_pipeline = [
        {"$group": {
            "_id": None,
            "total_paid_credits": {"$sum": "$paid_credits"},
            "total_bonus_credits": {"$sum": "$bonus_credits"}
        }}
    ]
    outstanding_result = await db.student_wallets.aggregate(outstanding_pipeline).to_list(1)
    outstanding_stats = outstanding_result[0] if outstanding_result else {"total_paid_credits": 0, "total_bonus_credits": 0}
    
    outstanding_paid = outstanding_stats.get("total_paid_credits", 0) or 0
    outstanding_bonus = outstanding_stats.get("total_bonus_credits", 0) or 0
    outstanding_total = outstanding_paid + outstanding_bonus
    
    # Potential future values
    potential_session_value = outstanding_total * BASE_CREDIT_PRICE
    potential_commission = potential_session_value * COMMISSION_RATE
    potential_tutor_payout = potential_session_value * TUTOR_PAYOUT_RATE
    
    # ============== TIME-BASED BREAKDOWN ==============
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    
    # Last 30 days commission
    recent_session_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago.isoformat()}}},
        {"$group": {
            "_id": None,
            "sessions": {"$sum": 1},
            "commission": {"$sum": "$platform_commission"},
            "tutor_payable": {"$sum": "$tutor_payout"}
        }}
    ]
    recent_result = await db.session_payment_records.aggregate(recent_session_pipeline).to_list(1)
    recent_stats = recent_result[0] if recent_result else {"sessions": 0, "commission": 0, "tutor_payable": 0}
    
    # Last 30 days cash collected
    recent_topup_pipeline = [
        {"$match": {
            "transaction_type": "topup_paid",
            "created_at": {"$gte": thirty_days_ago.isoformat()}
        }},
        {"$group": {
            "_id": None,
            "cash": {"$sum": "$payment_amount"}
        }}
    ]
    recent_topup_result = await db.wallet_transactions.aggregate(recent_topup_pipeline).to_list(1)
    recent_cash = recent_topup_result[0].get("cash", 0) if recent_topup_result else 0
    
    return {
        "cash_flow": {
            "total_cash_collected": cash_collected,
            "description": "Total money received from student top-ups",
            "last_30_days": recent_cash
        },
        "revenue_recognition": {
            "commission_earned": commission_earned,
            "description": "Platform commission from COMPLETED sessions only",
            "commission_rate": COMMISSION_RATE,
            "last_30_days": recent_stats.get("commission", 0),
            "note": "Revenue recognized only when sessions are delivered"
        },
        "tutor_payable": {
            "total_payable": tutor_payable,
            "already_paid": tutor_paid,
            "pending_payment": tutor_pending,
            "payout_rate": TUTOR_PAYOUT_RATE,
            "last_30_days": recent_stats.get("tutor_payable", 0),
            "description": "Amount owed to tutors from completed sessions"
        },
        "deferred_revenue": {
            "amount": max(0, deferred_revenue),
            "description": "Cash collected but not yet earned (outstanding credits)",
            "breakdown": {
                "cash_collected": cash_collected,
                "minus_revenue_recognized": revenue_recognized,
                "equals_deferred": max(0, deferred_revenue)
            }
        },
        "marketing_expense": {
            "realized": marketing_cost_realized,
            "description": "Cost of bonus credits used in completed sessions",
            "note": "Platform absorbs this cost as marketing expense"
        },
        "outstanding_credits": {
            "paid_credits": outstanding_paid,
            "bonus_credits": outstanding_bonus,
            "total_credits": outstanding_total,
            "potential_session_value": potential_session_value,
            "potential_commission": potential_commission,
            "potential_tutor_payout": potential_tutor_payout
        },
        "session_summary": {
            "total_completed": session_stats.get("total_sessions", 0),
            "total_session_value": session_stats.get("total_base_session_value", 0),
            "credits_consumed": session_stats.get("total_credits_used", 0),
            "paid_credits_consumed": session_stats.get("total_paid_credits_used", 0),
            "bonus_credits_consumed": session_stats.get("total_bonus_credits_used", 0),
            "last_30_days_sessions": recent_stats.get("sessions", 0)
        },
        "accounting_summary": {
            "gross_revenue": commission_earned + tutor_payable,
            "net_platform_revenue": commission_earned - marketing_cost_realized,
            "platform_margin_percent": round((commission_earned / (commission_earned + tutor_payable) * 100), 2) if (commission_earned + tutor_payable) > 0 else COMMISSION_RATE * 100
        }
    }



# ============================================================
# GOD-MODE TOOLS: Impersonation, Suspend, Wallet Adjust
# ============================================================

class WalletAdjustment(BaseModel):
    user_id: str
    amount: float
    reason: str = "Admin adjustment"


@admin_router.post("/users/{user_id}/impersonate")
async def impersonate_user(user_id: str, request: Request):
    """Create a session token for the target user so admin can login as them."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    admin_session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not admin_session:
        raise HTTPException(status_code=401, detail="Invalid session")
    admin_user = await db.users.find_one({"user_id": admin_session["user_id"]}, {"_id": 0})
    if not admin_user or admin_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    impersonate_token = f"imp_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": impersonate_token,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_impersonation": True,
        "admin_user_id": admin_user["user_id"],
    })

    return {
        "token": impersonate_token,
        "user": {
            "user_id": target_user["user_id"],
            "name": target_user.get("name"),
            "email": target_user.get("email"),
            "role": target_user.get("role"),
            "picture": target_user.get("picture"),
        },
    }


@admin_router.post("/users/{user_id}/suspend")
async def suspend_user(user_id: str, request: Request):
    """Toggle suspend/activate a user."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    admin_session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not admin_session:
        raise HTTPException(status_code=401, detail="Invalid session")
    admin_user = await db.users.find_one({"user_id": admin_session["user_id"]}, {"_id": 0})
    if not admin_user or admin_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = "active" if target.get("status") == "suspended" else "suspended"
    await db.users.update_one({"user_id": user_id}, {"$set": {"status": new_status}})

    if new_status == "suspended":
        await db.user_sessions.delete_many({"user_id": user_id})

    return {"user_id": user_id, "status": new_status}


@admin_router.post("/users/wallet-adjust")
async def adjust_wallet(adj: WalletAdjustment, request: Request):
    """Manually adjust a student wallet balance (refunds/credits)."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    admin_session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not admin_session:
        raise HTTPException(status_code=401, detail="Invalid session")

    user = await db.users.find_one({"user_id": adj.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    student = await db.students.find_one({"user_id": adj.user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    wallet = await db.wallets.find_one({"student_id": student["student_id"]}, {"_id": 0})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    new_balance = max(0, wallet.get("paid_credits", 0) + adj.amount)
    await db.wallets.update_one(
        {"student_id": student["student_id"]},
        {"$set": {"paid_credits": new_balance}}
    )

    await db.wallet_transactions.insert_one({
        "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
        "student_id": student["student_id"],
        "type": "admin_adjustment",
        "amount": abs(adj.amount),
        "credits": adj.amount,
        "description": adj.reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"success": True, "new_paid_credits": new_balance}


# ============================================================
# ENHANCED OVERVIEW: Today's Live Sessions with real names
# ============================================================

@admin_router.get("/overview/live-sessions")
async def get_live_sessions(request: Request):
    """Get today's sessions with student and teacher names."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_end = (now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).isoformat()

    bookings = await db.bookings.find({
        "start_time_utc": {"$gte": today_start, "$lt": today_end},
        "status": {"$in": ["scheduled", "completed", "in_progress"]},
    }, {"_id": 0}).sort("start_time_utc", 1).to_list(50)

    results = []
    for b in bookings:
        student_name = "Unknown Student"
        teacher_name = "Unknown Teacher"

        if b.get("teacher_name"):
            teacher_name = b["teacher_name"]
        else:
            teacher = await db.teachers.find_one({"teacher_id": b.get("teacher_id")}, {"_id": 0, "user_id": 1})
            if teacher:
                tu = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0, "name": 1})
                if tu:
                    teacher_name = tu.get("name", "Unknown Teacher")

        student = await db.students.find_one({"student_id": b.get("student_id")}, {"_id": 0, "user_id": 1})
        if student:
            su = await db.users.find_one({"user_id": student["user_id"]}, {"_id": 0, "name": 1})
            if su:
                student_name = su.get("name", "Unknown Student")

        cs = await db.class_sessions.find_one({"booking_id": b["booking_id"]}, {"_id": 0, "session_id": 1, "meet_link_slug": 1})

        results.append({
            "booking_id": b["booking_id"],
            "student_name": student_name,
            "teacher_name": teacher_name,
            "start_time_utc": b["start_time_utc"],
            "end_time_utc": b.get("end_time_utc"),
            "status": b["status"],
            "duration_minutes": b.get("duration_minutes", 60),
            "session_id": cs.get("session_id") if cs else None,
            "meet_link_slug": cs.get("meet_link_slug") if cs else None,
        })

    return {"sessions": results, "count": len(results)}


# ============================================================
# CONTENT LIBRARY: Learning Activities CRUD
# ============================================================

class ActivityCreate(BaseModel):
    title: str
    activity_type: str
    payload: dict = {}
    description: str = ""


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    activity_type: Optional[str] = None
    payload: Optional[dict] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@admin_router.get("/activities")
async def list_activities(request: Request):
    activities = await db.learning_activities.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"activities": activities}


@admin_router.post("/activities")
async def create_activity(activity: ActivityCreate, request: Request):
    doc = {
        "activity_id": f"act_{uuid.uuid4().hex[:12]}",
        "title": activity.title,
        "activity_type": activity.activity_type,
        "payload": activity.payload,
        "description": activity.description,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.learning_activities.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/activities/{activity_id}")
async def update_activity(activity_id: str, update: ActivityUpdate, request: Request):
    updates = {k: v for k, v in update.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.learning_activities.update_one({"activity_id": activity_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    updated = await db.learning_activities.find_one({"activity_id": activity_id}, {"_id": 0})
    return updated


@admin_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, request: Request):
    result = await db.learning_activities.delete_one({"activity_id": activity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"success": True}


# ============================================================
# ADMIN SETTINGS: API Key Storage
# ============================================================

class AdminSettings(BaseModel):
    billplz_api_key: Optional[str] = None
    billplz_collection_id: Optional[str] = None
    gcs_credentials_json: Optional[str] = None
    whatsapp_api_key: Optional[str] = None


@admin_router.get("/settings")
async def get_settings(request: Request):
    settings = await db.admin_settings.find_one({"_id_key": "global"}, {"_id": 0})
    if not settings:
        return {"billplz_api_key": "", "billplz_collection_id": "", "gcs_credentials_json": "", "whatsapp_api_key": ""}
    for key in ["billplz_api_key", "billplz_collection_id", "gcs_credentials_json", "whatsapp_api_key"]:
        val = settings.get(key, "")
        if val and len(val) > 8:
            settings[key] = val[:4] + "*" * (len(val) - 8) + val[-4:]
    return settings


@admin_router.put("/settings")
async def update_settings(settings: AdminSettings, request: Request):
    updates = {}
    for key, val in settings.dict().items():
        if val is not None and "****" not in val:
            updates[key] = val
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.admin_settings.update_one(
        {"_id_key": "global"},
        {"$set": updates},
        upsert=True,
    )
    return {"success": True, "updated_fields": list(updates.keys())}

