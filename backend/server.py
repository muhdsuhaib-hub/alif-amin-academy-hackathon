from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid
import httpx
from typing import Optional, List, Dict, Any
from models import (
    User, UserSession, Teacher, TeacherCreate, Student, StudentCreate,
    AvailabilitySlot, AvailabilityCreate, Booking, BookingCreate,
    Lesson, LessonCreate, Progress, Subscription, Payment
)
from admin_routes import admin_router, init_admin_routes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)


@api_router.get("/")
async def root():
    return {"message": "Alif Amin Academy API", "version": "1.0"}


@api_router.get("/auth/session-data")
async def get_session_data(request: Request):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="X-Session-ID header required")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10.0
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch session data")
        
        session_data = response.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": session_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": session_data["name"],
                "picture": session_data["picture"]
            }}
        )
    else:
        new_user = {
            "user_id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data.get("picture"),
            "role": "student",
            "timezone": "UTC",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    session_token = session_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": user_doc,
        "session_token": session_token
    }


@api_router.post("/auth/complete-onboarding")
async def complete_onboarding(onboarding_data: dict, current_user: User = Depends(get_current_user)):
    # Create student profile if it doesn't exist
    existing_student = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not existing_student:
        student_id = f"student_{uuid.uuid4().hex[:12]}"
        student_doc = {
            "student_id": student_id,
            "user_id": current_user.user_id,
            "parent_name": None,
            "parent_email": None,
            "parent_phone": None,
            "current_level": onboarding_data.get("level", "beginner"),
            "subscription_status": "trial",
            "subscription_plan": None,
            "next_billing_date": None
        }
        await db.students.insert_one(student_doc)
        
        # Create progress tracking
        progress_id = f"progress_{uuid.uuid4().hex[:12]}"
        progress_doc = {
            "progress_id": progress_id,
            "student_id": student_id,
            "current_surah": "Al-Fatiha",
            "current_surah_number": 1,
            "verses_completed": 0,
            "total_verses_in_surah": 7,
            "completion_percentage": 0.0,
            "total_classes_taken": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.progress.insert_one(progress_doc)
    
    return {"message": "Onboarding completed successfully"}


@api_router.post("/auth/register-teacher")
async def register_teacher(current_user: User = Depends(get_current_user)):
    """Register a user as a teacher (pending approval)"""
    
    # Check if already a teacher
    existing_teacher = await db.teachers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if existing_teacher:
        return {"message": "Already registered as teacher", "teacher": existing_teacher}
    
    # Update user role to teacher
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"role": "teacher"}}
    )
    
    # Create teacher profile (pending approval)
    teacher_id = f"teacher_{uuid.uuid4().hex[:12]}"
    teacher_doc = {
        "teacher_id": teacher_id,
        "user_id": current_user.user_id,
        "bio": "",
        "specializations": [],
        "hourly_rate": 50,  # Default rate
        "rating": 5.0,
        "total_classes": 0,
        "is_active": False,  # Pending approval
        "approval_status": "pending",
        "meet_link": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.teachers.insert_one(teacher_doc)
    
    return {"message": "Teacher registration submitted", "teacher_id": teacher_id, "status": "pending"}


@api_router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@api_router.post("/auth/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user), session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out successfully"}


@api_router.get("/teachers")
async def get_teachers():
    teachers = await db.teachers.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    teacher_list = []
    for teacher in teachers:
        user_doc = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
        teacher_with_user = {**teacher, "user": user_doc}
        teacher_list.append(teacher_with_user)
    
    return teacher_list


@api_router.get("/teachers/dashboard")
async def get_teacher_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    teacher_doc = await db.teachers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not teacher_doc:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    todays_classes = await db.bookings.find({
        "teacher_id": teacher_doc["teacher_id"],
        "status": "scheduled",
        "start_time_utc": {
            "$gte": today_start.isoformat(),
            "$lt": today_end.isoformat()
        }
    }, {"_id": 0}).sort("start_time_utc", 1).to_list(20)
    
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    completed_this_month = await db.bookings.count_documents({
        "teacher_id": teacher_doc["teacher_id"],
        "status": "completed",
        "start_time_utc": {"$gte": month_start.isoformat()}
    })
    
    estimated_earnings = completed_this_month * teacher_doc.get("hourly_rate", 0)
    
    return {
        "teacher": teacher_doc,
        "todays_classes": todays_classes,
        "completed_this_month": completed_this_month,
        "estimated_earnings": estimated_earnings
    }


@api_router.get("/teachers/{teacher_id}")
async def get_teacher(teacher_id: str):
    teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    user_doc = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
    return {**teacher, "user": user_doc}


@api_router.get("/teachers/{teacher_id}/availability")
async def get_teacher_availability(teacher_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {"teacher_id": teacher_id, "is_booked": False}
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
        query["start_time_utc"] = {"$gte": start_dt.isoformat()}
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
        if "start_time_utc" in query:
            query["start_time_utc"]["$lte"] = end_dt.isoformat()
        else:
            query["start_time_utc"] = {"$lte": end_dt.isoformat()}
    
    slots = await db.availability_slots.find(query, {"_id": 0}).to_list(1000)
    return slots


@api_router.post("/teachers/{teacher_id}/availability")
async def create_availability(teacher_id: str, availability: AvailabilityCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    teacher_doc = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
    if not teacher_doc:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    if current_user.role == "teacher" and teacher_doc["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    slot_id = f"slot_{uuid.uuid4().hex[:12]}"
    slot_doc = {
        "slot_id": slot_id,
        "teacher_id": teacher_id,
        "start_time_utc": availability.start_time_utc.isoformat(),
        "end_time_utc": availability.end_time_utc.isoformat(),
        "is_booked": False,
        "recurring": availability.recurring,
        "recurrence_pattern": availability.recurrence_pattern
    }
    
    await db.availability_slots.insert_one(slot_doc)
    return {"message": "Availability created", "slot_id": slot_id}


@api_router.get("/bookings")
async def get_bookings(current_user: User = Depends(get_current_user), status: Optional[str] = None):
    query = {}
    
    if current_user.role == "student":
        student_doc = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
        if not student_doc:
            return []
        query["student_id"] = student_doc["student_id"]
    elif current_user.role == "teacher":
        teacher_doc = await db.teachers.find_one({"user_id": current_user.user_id}, {"_id": 0})
        if not teacher_doc:
            return []
        query["teacher_id"] = teacher_doc["teacher_id"]
    
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("start_time_utc", -1).to_list(100)
    
    enriched_bookings = []
    for booking in bookings:
        student_doc = await db.students.find_one({"student_id": booking["student_id"]}, {"_id": 0})
        teacher_doc = await db.teachers.find_one({"teacher_id": booking["teacher_id"]}, {"_id": 0})
        
        student_user = await db.users.find_one({"user_id": student_doc["user_id"]}, {"_id": 0}) if student_doc else None
        teacher_user = await db.users.find_one({"user_id": teacher_doc["user_id"]}, {"_id": 0}) if teacher_doc else None
        
        enriched_bookings.append({
            **booking,
            "student": {**student_doc, "user": student_user} if student_doc else None,
            "teacher": {**teacher_doc, "user": teacher_user} if teacher_doc else None
        })
    
    return enriched_bookings


@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["student", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student_doc = await db.students.find_one({"student_id": booking.student_id}, {"_id": 0})
    if not student_doc:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if current_user.role == "student" and student_doc["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    slot = await db.availability_slots.find_one({
        "teacher_id": booking.teacher_id,
        "start_time_utc": booking.start_time_utc.isoformat(),
        "is_booked": False
    }, {"_id": 0})
    
    if not slot:
        raise HTTPException(status_code=400, detail="Time slot not available")
    
    teacher_doc = await db.teachers.find_one({"teacher_id": booking.teacher_id}, {"_id": 0})
    meet_link = teacher_doc.get("meet_link") if teacher_doc else None
    
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking_doc = {
        "booking_id": booking_id,
        "student_id": booking.student_id,
        "teacher_id": booking.teacher_id,
        "start_time_utc": booking.start_time_utc.isoformat(),
        "end_time_utc": booking.end_time_utc.isoformat(),
        "status": "scheduled",
        "booking_type": booking.booking_type,
        "meet_link": meet_link,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    await db.availability_slots.update_one(
        {"slot_id": slot["slot_id"]},
        {"$set": {"is_booked": True}}
    )
    
    return {"message": "Booking created", "booking_id": booking_id, "meet_link": meet_link}


@api_router.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    start_time = datetime.fromisoformat(booking["start_time_utc"])
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    
    time_until_class = start_time - datetime.now(timezone.utc)
    if time_until_class.total_seconds() < 12 * 3600:
        raise HTTPException(status_code=400, detail="Cannot cancel within 12 hours of class")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await db.availability_slots.update_one(
        {"teacher_id": booking["teacher_id"], "start_time_utc": booking["start_time_utc"]},
        {"$set": {"is_booked": False}}
    )
    
    return {"message": "Booking cancelled"}


@api_router.post("/lessons")
async def create_lesson(lesson: LessonCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    booking = await db.bookings.find_one({"booking_id": lesson.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    lesson_id = f"lesson_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    lesson_doc = {
        "lesson_id": lesson_id,
        "booking_id": lesson.booking_id,
        "teacher_notes": lesson.teacher_notes,
        "homework": lesson.homework,
        "attendance_status": lesson.attendance_status,
        "surah_covered": lesson.surah_covered,
        "verses_covered": lesson.verses_covered,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.lessons.insert_one(lesson_doc)
    await db.bookings.update_one(
        {"booking_id": lesson.booking_id},
        {"$set": {"status": "completed"}}
    )
    
    return {"message": "Lesson created", "lesson_id": lesson_id}


@api_router.get("/students/dashboard")
async def get_student_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student_doc = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not student_doc:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    upcoming_bookings = await db.bookings.find({
        "student_id": student_doc["student_id"],
        "status": "scheduled",
        "start_time_utc": {"$gte": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0}).sort("start_time_utc", 1).limit(5).to_list(5)
    
    past_bookings = await db.bookings.find({
        "student_id": student_doc["student_id"],
        "status": "completed"
    }, {"_id": 0}).sort("start_time_utc", -1).limit(10).to_list(10)
    
    progress_doc = await db.progress.find_one({"student_id": student_doc["student_id"]}, {"_id": 0})
    
    return {
        "student": student_doc,
        "upcoming_classes": upcoming_bookings,
        "past_classes": past_bookings,
        "progress": progress_doc
    }


@api_router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_users = await db.users.count_documents({})
    total_students = await db.students.count_documents({})
    total_teachers = await db.teachers.count_documents({"is_active": True})
    total_bookings = await db.bookings.count_documents({})
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_start = today_start - timedelta(days=7)
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    new_signups_today = await db.users.count_documents({
        "created_at": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
    })
    
    new_signups_week = await db.users.count_documents({
        "created_at": {"$gte": week_start.isoformat()}
    })
    
    bookings_this_month = await db.bookings.count_documents({
        "created_at": {"$gte": month_start.isoformat()}
    })
    
    completed_bookings = await db.bookings.count_documents({"status": "completed"})
    
    todays_classes = await db.bookings.find({
        "start_time_utc": {
            "$gte": today_start.isoformat(),
            "$lt": today_end.isoformat()
        },
        "status": "scheduled"
    }, {"_id": 0}).to_list(100)
    
    trial_students = await db.students.find({
        "subscription_status": "trial"
    }, {"_id": 0}).to_list(100)
    
    revenue_mtd = completed_bookings * 80
    conversion_rate = (total_students / max(total_users, 1)) * 100
    
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    last_month_bookings = await db.bookings.count_documents({
        "created_at": {
            "$gte": last_month_start.isoformat(),
            "$lt": month_start.isoformat()
        }
    })
    
    booking_trend = "up" if bookings_this_month > last_month_bookings else "down"
    
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_bookings": total_bookings,
        "new_signups_today": new_signups_today,
        "new_signups_week": new_signups_week,
        "bookings_this_month": bookings_this_month,
        "revenue_mtd": revenue_mtd,
        "conversion_rate": round(conversion_rate, 1),
        "booking_trend": booking_trend,
        "todays_classes": todays_classes,
        "trial_students": trial_students[:5],
        "completed_bookings": completed_bookings
    }


@api_router.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_current_user), role: Optional[str] = None):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0}).to_list(1000)
    return users


@api_router.post("/admin/teachers")
async def create_teacher_profile(teacher: TeacherCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.users.update_one(
        {"user_id": teacher.user_id},
        {"$set": {"role": "teacher"}}
    )
    
    teacher_id = f"teacher_{uuid.uuid4().hex[:12]}"
    teacher_doc = {
        "teacher_id": teacher_id,
        "user_id": teacher.user_id,
        "bio": teacher.bio,
        "hourly_rate": teacher.hourly_rate,
        "meet_link": teacher.meet_link,
        "specializations": teacher.specializations,
        "years_experience": teacher.years_experience,
        "is_active": True,
        "rating": 0.0,
        "total_classes": 0
    }
    
    await db.teachers.insert_one(teacher_doc)
    return {"message": "Teacher profile created", "teacher_id": teacher_id}


@api_router.post("/admin/students")
async def create_student_profile(student: StudentCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.users.update_one(
        {"user_id": student.user_id},
        {"$set": {"role": "student"}}
    )
    
    student_id = f"student_{uuid.uuid4().hex[:12]}"
    student_doc = {
        "student_id": student_id,
        "user_id": student.user_id,
        "parent_name": student.parent_name,
        "parent_email": student.parent_email,
        "parent_phone": student.parent_phone,
        "current_level": student.current_level,
        "subscription_status": "inactive",
        "subscription_plan": None,
        "next_billing_date": None
    }
    
    await db.students.insert_one(student_doc)
    
    progress_id = f"progress_{uuid.uuid4().hex[:12]}"
    progress_doc = {
        "progress_id": progress_id,
        "student_id": student_id,
        "current_surah": "Al-Fatiha",
        "current_surah_number": 1,
        "verses_completed": 0,
        "total_verses_in_surah": 7,
        "completion_percentage": 0.0,
        "total_classes_taken": 0,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.progress.insert_one(progress_doc)
    
    return {"message": "Student profile created", "student_id": student_id}


app.include_router(api_router)

# Initialize admin routes with database
init_admin_routes(db)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
