from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import os
from typing import Optional, List
from pydantic import BaseModel
from models import User, Teacher, Student

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

admin_router = APIRouter(prefix="/api/admin")


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
async def get_all_users(role: Optional[str] = None, search: Optional[str] = None, page: int = 1, limit: int = 20):
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    # Enrich with additional data
    for user in users:
        if user.get("role") == "student":
            student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
            if student:
                user["student_info"] = student
        elif user.get("role") == "teacher":
            teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
            if teacher:
                user["teacher_info"] = teacher
    
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
    
    # Get teacher info for meet link
    teacher = await db.teachers.find_one({"teacher_id": booking.teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    start_time = datetime.fromisoformat(booking.start_time_utc)
    end_time = start_time + timedelta(minutes=booking.duration_minutes)
    
    booking_doc = {
        "booking_id": booking_id,
        "student_id": booking.student_id,
        "teacher_id": booking.teacher_id,
        "start_time_utc": start_time.isoformat(),
        "end_time_utc": end_time.isoformat(),
        "status": "scheduled",
        "booking_type": booking.booking_type,
        "meet_link": teacher.get("meet_link"),
        "notes": booking.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "admin"
    }
    
    await db.bookings.insert_one(booking_doc)
    
    return {"message": "Manual booking created", "booking_id": booking_id}


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
            # Get teacher rate or use default
            teacher = await db.teachers.find_one({"teacher_id": booking["teacher_id"]}, {"_id": 0})
            rate = teacher.get("hourly_rate", 80) if teacher else 80
            total_revenue += rate
    
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
        
        # Calculate payment
        hourly_rate = teacher.get("hourly_rate", 80)
        total_hours = completed_classes  # Assuming 1 hour per class
        payment = total_hours * hourly_rate
        total_payroll += payment
        
        # Get teacher user info
        user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
        
        payroll_data.append({
            "teacher_id": teacher["teacher_id"],
            "teacher_name": user.get("name") if user else "Unknown",
            "email": user.get("email") if user else "",
            "hourly_rate": hourly_rate,
            "completed_classes": completed_classes,
            "total_hours": total_hours,
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
    
    result = await db.students.update_one(
        {"student_id": sub_update.student_id},
        {"$set": update_data}
    )
    
    return {"message": f"Subscription {sub_update.action} successful"}


@admin_router.get("/subscriptions/overview")
async def get_subscriptions_overview():
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
