from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import math
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid
import httpx
from typing import Optional, List, Dict, Any
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from models import (
    User, UserSession, Teacher, TeacherCreate, Student, StudentCreate,
    AvailabilitySlot, AvailabilityCreate, Booking, BookingCreate,
    Lesson, LessonCreate, Progress, Subscription, Payment
)
from admin_routes import admin_router, init_admin_routes
from notification_routes import notification_router, init_notification_routes
from wallet_routes import wallet_router, init_wallet_routes
from commission_routes import commission_router, init_commission_routes
from tutor_earnings_routes import tutor_earnings_router, init_tutor_earnings_routes, credit_tutor_earnings
from booking_routes import booking_router, init_booking_routes
from classroom_routes import classroom_router, init_classroom_routes
from quran_routes import quran_router, init_quran_routes
from upload_routes import upload_router, init_upload_routes
from payment_routes import payment_router, init_payment_routes
from credentials import init_credentials

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)


# Auth Models
class EmailRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str = "student"
    schedule_preference: Optional[str] = None
    reading_level: Optional[str] = None
    goals: Optional[List[str]] = None


class EmailLogin(BaseModel):
    email: EmailStr
    password: str
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


# Email/Password Registration
@api_router.post("/auth/register")
async def register_with_email(data: EmailRegister):
    """Register a new user with email and password"""
    # Check if email already exists
    existing_user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered. Please login instead.")
    
    # Hash the password
    hashed_password = pwd_context.hash(data.password)
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.full_name,
        "password_hash": hashed_password,
        "picture": None,
        "role": data.role,
        "phone": data.phone,
        "timezone": "UTC",
        "auth_provider": "email",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    # Remove _id added by MongoDB
    user_doc.pop('_id', None)
    
    # Create student profile if role is student
    if data.role == "student":
        student_id = f"student_{uuid.uuid4().hex[:12]}"
        student_doc = {
            "student_id": student_id,
            "user_id": user_id,
            "parent_name": None,
            "parent_email": None,
            "parent_phone": data.phone,
            "current_level": data.reading_level or "beginner",
            "schedule_preference": data.schedule_preference,
            "goals": data.goals,
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
    elif data.role == "teacher":
        # Create teacher profile with pending approval status
        teacher_id = f"teacher_{uuid.uuid4().hex[:12]}"
        teacher_doc = {
            "teacher_id": teacher_id,
            "user_id": user_id,
            "bio": "",
            "experience_years": 0,
            "specializations": [],
            "languages": ["Malay", "English"],
            "rating": 0.0,
            "total_reviews": 0,
            "is_active": False,
            "approval_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.teachers.insert_one(teacher_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at
    })
    
    # Return user without password
    user_response = {k: v for k, v in user_doc.items() if k != "password_hash"}
    
    return {
        "message": "Registration successful",
        "user": user_response,
        "session_token": session_token,
        "redirect_to": f"/{data.role}/dashboard"
    }


# Email/Password Login
@api_router.post("/auth/login")
async def login_with_email(data: EmailLogin):
    """Login with email and password"""
    user_doc = await db.users.find_one({"email": data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has a password (email registered)
    if not user_doc.get("password_hash"):
        raise HTTPException(status_code=400, detail="This account uses Google login. Please sign in with Google.")
    
    # Verify password
    if not pwd_context.verify(data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "created_at": datetime.now(timezone.utc),
        "expires_at": expires_at
    })
    
    # Return user without password
    user_response = {k: v for k, v in user_doc.items() if k not in ["password_hash", "_id"]}
    
    # Determine redirect based on role
    role = user_doc.get("role", "student")
    redirect_to = f"/{role}/dashboard"
    if role == "admin":
        redirect_to = "/admin/dashboard"
    
    return {
        "message": "Login successful",
        "user": user_response,
        "session_token": session_token,
        "redirect_to": redirect_to
    }


# Check if email exists (for showing login vs register)
@api_router.get("/auth/check-email")
async def check_email(email: str):
    """Check if email is already registered"""
    user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    if user:
        return {
            "exists": True,
            "auth_provider": user.get("auth_provider", "google"),
            "role": user.get("role", "student")
        }
    return {"exists": False}


# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@api_router.get("/auth/google/callback")
async def google_oauth_callback(request: Request, code: str, state: Optional[str] = None):
    """Handle Google OAuth callback - exchange code for tokens and create/login user"""
    
    # Build redirect URI from forwarded headers (Kubernetes ingress)
    forwarded_host = request.headers.get("x-forwarded-host", request.headers.get("host", ""))
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    if forwarded_host:
        redirect_uri = f"{forwarded_proto}://{forwarded_host}/api/auth/google/callback"
    else:
        redirect_uri = str(request.base_url).rstrip('/') + "/api/auth/google/callback"
    logger.info(f"Google OAuth redirect_uri: {redirect_uri}")
    
    # Exchange authorization code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            },
            timeout=10.0
        )
        
        if token_response.status_code != 200:
            logger.error(f"Token exchange failed: {token_response.text}")
            # Redirect to frontend with error
            return Response(
                status_code=302,
                headers={"Location": "/auth?error=google_auth_failed"}
            )
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        # Get user info from Google
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0
        )
        
        if userinfo_response.status_code != 200:
            logger.error(f"Userinfo fetch failed: {userinfo_response.text}")
            return Response(
                status_code=302,
                headers={"Location": "/auth?error=google_userinfo_failed"}
            )
        
        user_info = userinfo_response.json()
    
    # Extract user data
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")
    
    if not email:
        return Response(
            status_code=302,
            headers={"Location": "/auth?error=no_email"}
        )
    
    # Check if this is a teacher signup (from state parameter)
    is_teacher_signup = state == "teacher_signup"
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        role = existing_user.get("role", "student")
        
        # If existing user is signing up as teacher and isn't already a teacher
        if is_teacher_signup and role == "student":
            # Update role to teacher
            role = "teacher"
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": name,
                    "picture": picture,
                    "role": "teacher",
                    "auth_provider": "google"
                }}
            )
            # Create teacher profile with pending status
            teacher_id = f"teacher_{uuid.uuid4().hex[:12]}"
            teacher_doc = {
                "teacher_id": teacher_id,
                "user_id": user_id,
                "bio": "",
                "experience_years": 0,
                "specializations": [],
                "languages": ["Malay", "English"],
                "rating": 0.0,
                "total_reviews": 0,
                "is_active": False,
                "approval_status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.teachers.insert_one(teacher_doc)
        else:
            # Just update user info
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": name,
                    "picture": picture,
                    "auth_provider": "google"
                }}
            )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Check if this is an admin email
        admin_emails = ["muhdsuhaib@gmail.com", "hello.alifamin@gmail.com"]
        if email in admin_emails:
            role = "admin"
        elif is_teacher_signup:
            role = "teacher"
        else:
            role = "student"
        
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "timezone": "UTC",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        
        # Create appropriate profile based on role
        if role == "student":
            student_id = f"student_{uuid.uuid4().hex[:12]}"
            student_doc = {
                "student_id": student_id,
                "user_id": user_id,
                "parent_name": None,
                "parent_email": None,
                "parent_phone": None,
                "current_level": "beginner",
                "subscription_status": "trial",
                "subscription_plan": None,
                "next_billing_date": None
            }
            await db.students.insert_one(student_doc)
        elif role == "teacher":
            teacher_id = f"teacher_{uuid.uuid4().hex[:12]}"
            teacher_doc = {
                "teacher_id": teacher_id,
                "user_id": user_id,
                "bio": "",
                "experience_years": 0,
                "specializations": [],
                "languages": ["Malay", "English"],
                "rating": 0.0,
                "total_reviews": 0,
                "is_active": False,
                "approval_status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.teachers.insert_one(teacher_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Determine redirect based on role
    if role == "admin":
        redirect_path = "/admin/dashboard"
    elif role == "teacher":
        redirect_path = "/teacher/dashboard"
    else:
        redirect_path = "/student/dashboard"
    
    # Redirect to frontend with session token in cookie
    response = Response(
        status_code=302,
        headers={"Location": redirect_path}
    )
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=False,
        secure=True,
        samesite="none",
        path="/"
    )
    
    return response


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
        "rating": 5.0,
        "total_classes": 0,
        "is_active": False,  # Pending approval
        "approval_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.teachers.insert_one(teacher_doc)
    
    return {"message": "Teacher registration submitted", "teacher_id": teacher_id, "status": "pending"}


@api_router.get("/auth/me")
async def get_current_user_info(request: Request, current_user: User = Depends(get_current_user)):
    user_dict = current_user.dict()
    # Convert datetime to string for JSON serialization
    if isinstance(user_dict.get("created_at"), datetime):
        user_dict["created_at"] = user_dict["created_at"].isoformat()
    # Check if this is an impersonation session — force onboarding bypass
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if token and token.startswith("imp_"):
        user_dict["onboarding_completed"] = True
    return user_dict



@api_router.put("/auth/update-profile")
async def update_profile(profile_data: dict, current_user: User = Depends(get_current_user)):
    """Update user profile fields"""
    allowed_fields = {"name", "phone", "timezone", "gender"}
    update_fields = {k: v for k, v in profile_data.items() if k in allowed_fields and v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    await db.users.update_one({"user_id": current_user.user_id}, {"$set": update_fields})
    # Return updated user data so frontend can update state
    updated_user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return {"message": "Profile updated successfully", "user": updated_user}


@api_router.post("/support")
async def create_support_ticket(ticket_data: dict, current_user: User = Depends(get_current_user)):
    """Create a support ticket"""
    subject = ticket_data.get("subject", "general")
    message = ticket_data.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    if subject not in ("technical", "billing", "general"):
        raise HTTPException(status_code=400, detail="Invalid subject")

    ticket_id = f"ticket_{uuid.uuid4().hex[:12]}"
    ticket_doc = {
        "ticket_id": ticket_id,
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "user_role": current_user.role,
        "subject": subject,
        "message": message,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.support_tickets.insert_one(ticket_doc)
    return {"message": "Support ticket created", "ticket_id": ticket_id}

@api_router.get("/admin/support-tickets")
async def get_support_tickets(status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Admin: List support tickets"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    query = {}
    if status:
        query["status"] = status
    tickets = await db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return {"tickets": tickets, "count": len(tickets)}



@api_router.put("/teacher/update-profile")
async def update_teacher_profile_v2(data: dict, current_user: User = Depends(get_current_user)):
    """Update teacher professional profile"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
    teacher = await db.teachers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    allowed = {"bio", "specializations", "years_experience"}
    update_fields = {k: v for k, v in data.items() if k in allowed and v is not None}
    if update_fields:
        await db.teachers.update_one({"teacher_id": teacher["teacher_id"]}, {"$set": update_fields})
    updated_teacher = await db.teachers.find_one({"teacher_id": teacher["teacher_id"]}, {"_id": 0})
    return {"message": "Teacher profile updated", "teacher": updated_teacher}

@api_router.get("/booking/teacher-students/{teacher_id}")
async def get_teacher_students_v2(teacher_id: str, current_user: User = Depends(get_current_user)):
    """Get unique students this teacher has taught, aggregated from class_sessions."""
    # Aggregate from class_sessions (primary source of truth for classroom data)
    pipeline = [
        {"$match": {"teacher_id": teacher_id}},
        {"$group": {
            "_id": "$student_id",
            "total_sessions": {"$sum": 1},
            "last_session_date": {"$max": "$start_time_utc"},
        }},
        {"$sort": {"last_session_date": -1}},
    ]
    aggregated = await db.class_sessions.aggregate(pipeline).to_list(200)

    # Also check bookings for any that might not have class_sessions yet
    booking_pipeline = [
        {"$match": {"teacher_id": teacher_id, "status": {"$in": ["completed", "scheduled"]}}},
        {"$group": {
            "_id": "$student_id",
            "total_bookings": {"$sum": 1},
            "last_booking_date": {"$max": "$start_time_utc"},
        }},
    ]
    booking_agg = await db.bookings.aggregate(booking_pipeline).to_list(200)
    booking_map = {b["_id"]: b for b in booking_agg if b["_id"]}

    # Merge both sources
    student_ids = set()
    merged = {}
    for item in aggregated:
        sid = item["_id"]
        if not sid:
            continue
        student_ids.add(sid)
        bdata = booking_map.get(sid, {})
        merged[sid] = {
            "total_sessions": max(item["total_sessions"], bdata.get("total_bookings", 0)),
            "last_session_date": item["last_session_date"] or bdata.get("last_booking_date"),
        }
    # Add bookings-only students
    for sid, bdata in booking_map.items():
        if sid and sid not in student_ids:
            student_ids.add(sid)
            merged[sid] = {
                "total_sessions": bdata["total_bookings"],
                "last_session_date": bdata["last_booking_date"],
            }

    results = []
    for sid in student_ids:
        student = await db.students.find_one({"student_id": sid}, {"_id": 0})
        student_user = None
        picture = None
        if student:
            student_user = await db.users.find_one({"user_id": student.get("user_id")}, {"_id": 0})
            if student_user:
                picture = student_user.get("picture")

        # Get latest progress scores (average over last 5 records)
        progress_records = await db.student_progress.find(
            {"student_id": sid},
            {"_id": 0, "grading": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5).to_list(5)

        fluency_scores = [r["grading"]["fluency_score"] for r in progress_records if r.get("grading", {}).get("fluency_score")]
        tajweed_scores = [r["grading"]["tajweed_score"] for r in progress_records if r.get("grading", {}).get("tajweed_score")]
        makhraj_scores = [r["grading"]["makhraj_score"] for r in progress_records if r.get("grading", {}).get("makhraj_score")]

        avg_f = round(sum(fluency_scores) / len(fluency_scores), 1) if fluency_scores else None
        avg_t = round(sum(tajweed_scores) / len(tajweed_scores), 1) if tajweed_scores else None
        avg_m = round(sum(makhraj_scores) / len(makhraj_scores), 1) if makhraj_scores else None

        # Get session notes from this teacher
        notes_cursor = db.student_progress.find(
            {"student_id": sid, "teacher_id": teacher_id, "teacher_comments": {"$exists": True, "$ne": ""}},
            {"_id": 0, "teacher_comments": 1, "created_at": 1, "grading": 1}
        ).sort("created_at", -1).limit(10)
        notes = await notes_cursor.to_list(10)

        m = merged[sid]
        results.append({
            "student_id": sid,
            "student_name": student_user.get("name", "Student") if student_user else "Student",
            "picture": picture,
            "reading_level": student.get("reading_level", "Beginner") if student else "Beginner",
            "current_level": student.get("current_level") if student else None,
            "total_sessions": m["total_sessions"],
            "last_session_date": m["last_session_date"],
            "is_active": True,
            "avg_fluency": avg_f,
            "avg_tajweed": avg_t,
            "avg_makhraj": avg_m,
            "notes": [
                {
                    "comment": n.get("teacher_comments", ""),
                    "date": n.get("created_at"),
                    "fluency": n.get("grading", {}).get("fluency_score"),
                    "tajweed": n.get("grading", {}).get("tajweed_score"),
                    "makhraj": n.get("grading", {}).get("makhraj_score"),
                }
                for n in notes
            ],
        })

    # Sort by last_session_date descending
    results.sort(key=lambda x: x.get("last_session_date") or "", reverse=True)
    return {"students": results}

@api_router.get("/booking/teacher-availability/{teacher_id}")
async def get_teacher_availability_v2(teacher_id: str, start_date: str = None, end_date: str = None):
    """Get teacher's availability slots for a date range"""
    query = {"teacher_id": teacher_id}
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}

    slots = await db.availability_slots.find(query, {"_id": 0}).to_list(500)
    return {"slots": slots}

@api_router.post("/booking/availability/bulk")
async def save_availability_bulk(data: dict, current_user: User = Depends(get_current_user)):
    """Save teacher availability for a week (replaces existing non-booked slots)"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")

    teacher_id = data.get("teacher_id")
    week_start = data.get("week_start")
    new_slots = data.get("slots", [])

    if not teacher_id or not week_start:
        raise HTTPException(status_code=400, detail="teacher_id and week_start required")

    # Calculate week end
    from datetime import timedelta
    start = datetime.fromisoformat(week_start)
    end = start + timedelta(days=7)
    week_end = end.strftime('%Y-%m-%d')

    # Delete existing non-booked slots for this week
    await db.availability_slots.delete_many({
        "teacher_id": teacher_id,
        "date": {"$gte": week_start, "$lt": week_end},
        "is_booked": {"$ne": True}
    })

    # Insert new slots
    if new_slots:
        docs = []
        for s in new_slots:
            slot_id = f"slot_{uuid.uuid4().hex[:12]}"
            docs.append({
                "slot_id": slot_id,
                "teacher_id": teacher_id,
                "date": s["date"],
                "start_time": f"{s['date']}T{s['start_time']}",
                "end_time": f"{s['date']}T{s['end_time']}",
                "day_of_week": datetime.fromisoformat(s["date"]).strftime('%A').lower(),
                "is_booked": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        if docs:
            await db.availability_slots.insert_many(docs)

    return {"message": f"Saved {len(new_slots)} availability slots", "count": len(new_slots)}




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

    # Enrich with session_id from class_sessions
    for cls in todays_classes:
        cs = await db.class_sessions.find_one(
            {"booking_id": cls.get("booking_id")}, {"_id": 0, "session_id": 1}
        )
        if cs:
            cls["session_id"] = cs["session_id"]
    
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    completed_this_month = await db.bookings.count_documents({
        "teacher_id": teacher_doc["teacher_id"],
        "status": "completed",
        "start_time_utc": {"$gte": month_start.isoformat()}
    })
    
    estimated_earnings = completed_this_month * 15  # RM15 per credit (platform standard rate)
    
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


@api_router.get("/teachers/{teacher_id}/students")
async def get_teacher_students(teacher_id: str, current_user: User = Depends(get_current_user)):
    """Get all students who have booked classes with this teacher"""
    # Get unique student IDs from bookings
    bookings = await db.bookings.find(
        {"teacher_id": teacher_id},
        {"student_id": 1, "_id": 0}
    ).to_list(1000)
    
    student_ids = list(set(b["student_id"] for b in bookings))
    
    students = []
    for student_id in student_ids:
        student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
        if student:
            # Get user info
            user = await db.users.find_one({"user_id": student["user_id"]}, {"_id": 0})
            # Get last booking
            last_booking = await db.bookings.find_one(
                {"student_id": student_id, "teacher_id": teacher_id},
                {"_id": 0},
                sort=[("start_time_utc", -1)]
            )
            
            # Get reading level from student profile (from onboarding) or user doc
            reading_level = student.get("current_level") or user.get("reading_level") if user else None
            if not reading_level:
                reading_level = "Not Set"
            
            students.append({
                "student_id": student_id,
                "name": user.get("name", "Unknown") if user else "Unknown",
                "email": user.get("email") if user else None,
                "current_level": reading_level,
                "last_session": last_booking.get("start_time_utc") if last_booking else None,
                "status": "active" if student.get("subscription_status") in ["trial", "active"] else "inactive"
            })
    
    return {"students": students}


@api_router.post("/teachers/log-progress")
async def log_student_progress(log_data: dict, current_user: User = Depends(get_current_user)):
    """Log a student's reading progress"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    log_id = f"log_{uuid.uuid4().hex[:12]}"
    log_entry = {
        "log_id": log_id,
        "student_id": log_data.get("student_id"),
        "teacher_id": log_data.get("teacher_id"),
        "current_book": log_data.get("currentBook"),
        "start_page": log_data.get("startPage"),
        "end_page": log_data.get("endPage"),
        "fluency_rating": log_data.get("fluencyRating"),
        "tajweed_notes": log_data.get("tajweedNotes"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.progress_logs.insert_one(log_entry)
    
    # Update student's current level in progress
    if log_data.get("currentBook"):
        await db.progress.update_one(
            {"student_id": log_data.get("student_id")},
            {"$set": {
                "current_surah": log_data.get("currentBook"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
    
    return {"message": "Progress logged successfully", "log_id": log_id}


@api_router.get("/teachers/{teacher_id}/transactions")
async def get_teacher_transactions(teacher_id: str, limit: int = 10, skip: int = 0, current_user: User = Depends(get_current_user)):
    """Get transaction history with live student names and pagination."""
    total = await db.tutor_earnings_transactions.count_documents({"teacher_id": teacher_id})
    transactions = await db.tutor_earnings_transactions.find(
        {"teacher_id": teacher_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    # Resolve live student names via $lookup
    for t in transactions:
        sid = t.get("student_id")
        if sid:
            student_doc = await db.students.find_one({"student_id": sid}, {"_id": 0, "user_id": 1})
            if student_doc:
                user_doc = await db.users.find_one({"user_id": student_doc["user_id"]}, {"_id": 0, "name": 1})
                if user_doc:
                    t["student_name"] = user_doc["name"]
                    dur = t.get("duration_minutes", 30)
                    t["description"] = f"{user_doc['name']} - {dur} min session"

    return {"transactions": transactions, "total": total, "limit": limit, "skip": skip}


@api_router.get("/teachers/notes/{student_id}")
async def get_student_notes(student_id: str, current_user: User = Depends(get_current_user)):
    """Get lesson notes for a student"""
    notes = await db.progress_logs.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    formatted_notes = []
    for note in notes:
        formatted_notes.append({
            "id": note.get("log_id"),
            "date": note.get("created_at", "")[:10],
            "note": note.get("tajweed_notes") or f"{note.get('current_book', '')} - {note.get('fluency_rating', '')}"
        })
    
    return {"notes": formatted_notes}


@api_router.put("/teachers/{teacher_id}/profile")
async def update_teacher_profile(teacher_id: str, profile_data: dict, current_user: User = Depends(get_current_user)):
    """Update teacher profile"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_fields = {}
    if "bio" in profile_data:
        update_fields["bio"] = profile_data["bio"]
    if "specializations" in profile_data:
        update_fields["specializations"] = profile_data["specializations"]
    if "yearsExperience" in profile_data:
        update_fields["years_experience"] = profile_data["yearsExperience"]
    
    if update_fields:
        await db.teachers.update_one(
            {"teacher_id": teacher_id},
            {"$set": update_fields}
        )
    
    return {"message": "Profile updated successfully"}


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
    
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking_doc = {
        "booking_id": booking_id,
        "student_id": booking.student_id,
        "teacher_id": booking.teacher_id,
        "start_time_utc": booking.start_time_utc.isoformat(),
        "end_time_utc": booking.end_time_utc.isoformat(),
        "status": "scheduled",
        "booking_type": booking.booking_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    await db.availability_slots.update_one(
        {"slot_id": slot["slot_id"]},
        {"$set": {"is_booked": True}}
    )
    
    return {"message": "Booking created", "booking_id": booking_id}


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
    
    # Include classes that started up to 2 hours ago (in-progress sessions)
    upcoming_cutoff = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    upcoming_bookings = await db.bookings.find({
        "student_id": student_doc["student_id"],
        "status": "scheduled",
        "start_time_utc": {"$gte": upcoming_cutoff}
    }, {"_id": 0}).sort("start_time_utc", 1).limit(10).to_list(10)
    
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



@api_router.get("/students/dashboard-data")
async def get_student_dashboard_data(current_user: User = Depends(get_current_user)):
    """Comprehensive student dashboard data: next class, wallet, progress scores, recent classes."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Not authorized")

    student_doc = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not student_doc:
        raise HTTPException(status_code=404, detail="Student profile not found")

    student_id = student_doc["student_id"]
    now = datetime.now(timezone.utc)

    # Upcoming bookings with session_id enrichment — include in-progress classes (started up to 2h ago)
    upcoming_cutoff = (now - timedelta(hours=2)).isoformat()
    upcoming_bookings = await db.bookings.find({
        "student_id": student_id,
        "status": "scheduled",
        "start_time_utc": {"$gte": upcoming_cutoff}
    }, {"_id": 0}).sort("start_time_utc", 1).limit(5).to_list(5)

    for b in upcoming_bookings:
        cs = await db.class_sessions.find_one(
            {"booking_id": b.get("booking_id")}, {"_id": 0, "session_id": 1}
        )
        if cs:
            b["session_id"] = cs["session_id"]
        # Enrich teacher name
        if not b.get("teacher_name"):
            teacher = await db.teachers.find_one({"teacher_id": b.get("teacher_id")}, {"_id": 0})
            if teacher:
                teacher_user = await db.users.find_one({"user_id": teacher.get("user_id")}, {"_id": 0})
                b["teacher_name"] = teacher_user.get("name", "Teacher") if teacher_user else "Teacher"

    # Past bookings
    past_bookings = await db.bookings.find({
        "student_id": student_id,
        "status": "completed"
    }, {"_id": 0}).sort("start_time_utc", -1).limit(5).to_list(5)

    for b in past_bookings:
        if not b.get("teacher_name"):
            teacher = await db.teachers.find_one({"teacher_id": b.get("teacher_id")}, {"_id": 0})
            if teacher:
                teacher_user = await db.users.find_one({"user_id": teacher.get("user_id")}, {"_id": 0})
                b["teacher_name"] = teacher_user.get("name", "Teacher") if teacher_user else "Teacher"

    # Wallet snapshot
    wallet = await db.student_wallets.find_one({"student_id": student_id}, {"_id": 0})
    wallet_snapshot = {
        "credit_balance": wallet.get("credit_balance", 0) if wallet else 0,
        "paid_credits": wallet.get("paid_credits", 0) if wallet else 0,
        "bonus_credits": wallet.get("bonus_credits", 0) if wallet else 0,
    }

    # Progress scores from classroom sessions
    progress_records = await db.student_progress.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)

    # Calculate average scores
    scores = {"fluency": [], "tajweed": [], "makhraj": []}
    for rec in progress_records:
        grading = rec.get("grading", {})
        if grading.get("fluency_score"):
            scores["fluency"].append(grading["fluency_score"])
        if grading.get("tajweed_score"):
            scores["tajweed"].append(grading["tajweed_score"])
        if grading.get("makhraj_score"):
            scores["makhraj"].append(grading["makhraj_score"])

    def avg(lst):
        return round(sum(lst) / len(lst), 1) if lst else 0
    progress_summary = {
        "total_sessions": len(progress_records),
        "avg_fluency": avg(scores["fluency"]),
        "avg_tajweed": avg(scores["tajweed"]),
        "avg_makhraj": avg(scores["makhraj"]),
        "score_history": [
            {
                "fluency": r.get("grading", {}).get("fluency_score", 0),
                "tajweed": r.get("grading", {}).get("tajweed_score", 0),
                "makhraj": r.get("grading", {}).get("makhraj_score", 0),
                "date": r.get("created_at", ""),
            }
            for r in reversed(progress_records)  # oldest first for chart
        ],
    }

    # Basic progress info
    basic_progress = await db.progress.find_one({"student_id": student_id}, {"_id": 0})

    return {
        "student": student_doc,
        "upcoming_classes": upcoming_bookings,
        "past_classes": past_bookings,
        "wallet": wallet_snapshot,
        "progress": progress_summary,
        "basic_progress": basic_progress,
    }



@api_router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_users = await db.users.count_documents({})
    total_students = await db.users.count_documents({"role": "student"})
    total_teachers = await db.users.count_documents({"role": "teacher"})
    pending_approvals = await db.teachers.count_documents({"approval_status": "pending"})
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

    # Enrich with session_id from class_sessions
    for cls in todays_classes:
        cs = await db.class_sessions.find_one(
            {"booking_id": cls.get("booking_id")}, {"_id": 0, "session_id": 1}
        )
        if cs:
            cls["session_id"] = cs["session_id"]
    
    trial_students = await db.students.find({
        "subscription_status": "trial"
    }, {"_id": 0}).to_list(100)
    
    # Enrich trial students with names from users collection
    for student in trial_students:
        user = await db.users.find_one({"user_id": student.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        if user:
            student["student_name"] = user.get("name", "Unknown")
            student["student_email"] = user.get("email", "")
    
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
    
    # Calculate real trend percentages
    last_month_users = await db.users.count_documents({
        "created_at": {"$gte": last_month_start.isoformat(), "$lt": month_start.isoformat()}
    })
    this_month_users = await db.users.count_documents({
        "created_at": {"$gte": month_start.isoformat()}
    })
    last_month_students = await db.students.count_documents({
        "created_at": {"$gte": last_month_start.isoformat(), "$lt": month_start.isoformat()}
    })
    this_month_students = await db.students.count_documents({
        "created_at": {"$gte": month_start.isoformat()}
    })
    last_month_completed = await db.bookings.count_documents({
        "status": "completed",
        "start_time_utc": {"$gte": last_month_start.isoformat(), "$lt": month_start.isoformat()}
    })
    this_month_completed = await db.bookings.count_documents({
        "status": "completed",
        "start_time_utc": {"$gte": month_start.isoformat()}
    })
    last_month_revenue = last_month_completed * 80
    this_month_revenue = this_month_completed * 80
    
    def calc_trend(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)
    
    user_trend = calc_trend(this_month_users, last_month_users)
    student_trend = calc_trend(this_month_students, last_month_students)
    revenue_trend = calc_trend(this_month_revenue, last_month_revenue)
    
    # Generate chart data from real DB data (last 6 months)
    now = datetime.now(timezone.utc)
    user_growth_data = []
    revenue_chart_data = []
    for i in range(5, -1, -1):
        target = now - timedelta(days=30 * i)
        m_start = target.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1)
        month_label = m_start.strftime('%b')
        
        u_count = await db.users.count_documents({
            "created_at": {"$gte": m_start.isoformat(), "$lt": m_end.isoformat()}
        })
        user_growth_data.append({"month": month_label, "users": u_count})
        
        r_count = await db.bookings.count_documents({
            "status": "completed",
            "start_time_utc": {"$gte": m_start.isoformat(), "$lt": m_end.isoformat()}
        })
        revenue_chart_data.append({"month": month_label, "revenue": r_count * 80})
    
    # Attendance data by day of week from completed bookings
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    total_by_day = {d: 0 for d in days}
    completed_by_day = {d: 0 for d in days}
    recent_bookings = await db.bookings.find({
        "start_time_utc": {"$gte": (now - timedelta(days=30)).isoformat()}
    }, {"_id": 0, "start_time_utc": 1, "status": 1}).to_list(500)
    for b in recent_bookings:
        try:
            dt = datetime.fromisoformat(b["start_time_utc"].replace("Z", "+00:00"))
            day_name = days[dt.weekday()]
            total_by_day[day_name] += 1
            if b.get("status") == "completed":
                completed_by_day[day_name] += 1
        except (ValueError, KeyError):
            pass
    attendance_data = []
    for d in days:
        rate = round((completed_by_day[d] / total_by_day[d]) * 100) if total_by_day[d] > 0 else 0
        attendance_data.append({"day": d, "rate": rate})
    
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "pending_approvals": pending_approvals,
        "total_bookings": total_bookings,
        "new_signups_today": new_signups_today,
        "new_signups_week": new_signups_week,
        "bookings_this_month": bookings_this_month,
        "revenue_mtd": revenue_mtd,
        "conversion_rate": round(conversion_rate, 1),
        "booking_trend": booking_trend,
        "todays_classes": todays_classes,
        "trial_students": trial_students[:5],
        "completed_bookings": completed_bookings,
        "trends": {
            "user_trend": user_trend,
            "student_trend": student_trend,
            "revenue_trend": revenue_trend,
        },
        "charts": {
            "user_growth": user_growth_data,
            "revenue_trend": revenue_chart_data,
            "attendance": attendance_data
        }
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


@api_router.put("/admin/users/{user_id}")
async def update_user_admin(user_id: str, request: Request, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    body = await request.json()
    allowed = {"name", "email", "phone", "role", "timezone", "gender"}
    updates = {k: v for k, v in body.items() if k in allowed and v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields")
    await db.users.update_one({"user_id": user_id}, {"$set": updates})
    return {"success": True}


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



@api_router.get("/teacher/dashboard-data")
async def get_teacher_dashboard_data(current_user: User = Depends(get_current_user)):
    """Comprehensive teacher dashboard data: next class, tier, earnings, stats."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")

    teacher = await db.teachers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    teacher_id = teacher["teacher_id"]
    now = datetime.now(timezone.utc)

    # Upcoming bookings — include in-progress (started up to 2h ago)
    upcoming_cutoff = (now - timedelta(hours=2)).isoformat()
    upcoming = await db.bookings.find({
        "teacher_id": teacher_id,
        "status": "scheduled",
        "start_time_utc": {"$gte": upcoming_cutoff}
    }, {"_id": 0}).sort("start_time_utc", 1).limit(10).to_list(10)

    for b in upcoming:
        cs = await db.class_sessions.find_one({"booking_id": b.get("booking_id")}, {"_id": 0, "session_id": 1})
        if cs:
            b["session_id"] = cs["session_id"]
        if b.get("student_id"):
            student = await db.students.find_one({"student_id": b["student_id"]}, {"_id": 0})
            if student:
                student_user = await db.users.find_one({"user_id": student.get("user_id")}, {"_id": 0})
                b["student_name"] = student_user.get("name", "Student") if student_user else "Student"

    # Commission tier evaluation
    total_sessions = teacher.get("total_classes", 0)
    avg_rating = teacher.get("rating", 0.0)
    tier_level = "new"
    commission_rate = 0.40
    tier_name = "New Tutor"

    if total_sessions >= 100 and avg_rating >= 4.7:
        tier_level, commission_rate, tier_name = "elite", 0.30, "Elite Tutor"
    elif total_sessions >= 20 and avg_rating >= 4.5:
        tier_level, commission_rate, tier_name = "rated", 0.35, "Rated Tutor"

    # Next tier progress
    if tier_level == "new":
        next_tier_name = "Rated Tutor"
        sessions_to_next = max(0, 20 - total_sessions)
        progress_pct = min(100, round((total_sessions / 20) * 100))
    elif tier_level == "rated":
        next_tier_name = "Elite Tutor"
        sessions_to_next = max(0, 100 - total_sessions)
        progress_pct = min(100, round((total_sessions / 100) * 100))
    else:
        next_tier_name = None
        sessions_to_next = 0
        progress_pct = 100

    # Month earnings — read from tutor_earnings (the ACTUAL earnings wallet)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    tutor_earnings = await db.tutor_earnings.find_one({"teacher_id": teacher_id}, {"_id": 0})

    # Get monthly transaction totals from tutor_earnings_transactions (correct collection)
    monthly_txns = await db.tutor_earnings_transactions.find({
        "teacher_id": teacher_id,
        "created_at": {"$gte": month_start},
        "transaction_type": "session_earning"
    }, {"_id": 0, "net_amount": 1, "gross_amount": 1, "amount": 1, "platform_fee": 1}).to_list(100)

    month_net = sum(t.get("net_amount", t.get("amount", 0)) for t in monthly_txns)
    month_gross = sum(t.get("gross_amount", 0) for t in monthly_txns)
    month_classes = len(monthly_txns)

    return {
        "teacher": teacher,
        "upcoming_classes": upcoming,
        "tier": {
            "level": tier_level,
            "name": tier_name,
            "commission_rate": commission_rate,
            "total_sessions": total_sessions,
            "avg_rating": avg_rating,
            "next_tier_name": next_tier_name,
            "sessions_to_next": sessions_to_next,
            "progress_pct": progress_pct,
        },
        "month_stats": {
            "net_earnings": round(month_net, 2),
            "gross_earnings": round(month_gross, 2),
            "classes_taught": month_classes,
        },
        "wallet": {
            "balance": tutor_earnings.get("withdrawable_balance", 0) if tutor_earnings else 0,
            "total_earned": tutor_earnings.get("total_earnings", 0) if tutor_earnings else 0,
            "total_withdrawn": tutor_earnings.get("total_withdrawn", 0) if tutor_earnings else 0,
        },
    }

@api_router.post("/teacher/request-payout")
async def request_payout(data: dict, current_user: User = Depends(get_current_user)):
    """Teacher requests a payout — ACID-compliant atomic transaction."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")

    teacher = await db.teachers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    bank_name = data.get("bank_name", "").strip()
    account_number = data.get("account_number", "").strip()
    account_holder = data.get("account_holder", "").strip()
    amount = float(data.get("amount", 0))

    if not bank_name or not account_number or not account_holder:
        raise HTTPException(status_code=400, detail="All bank details are required")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    teacher_id = teacher["teacher_id"]

    # Check for existing pending payout
    existing = await db.payout_requests.find_one({"teacher_id": teacher_id, "status": "pending"})
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending payout request")

    # Read current balance from tutor_earnings (single source of truth)
    earnings = await db.tutor_earnings.find_one({"teacher_id": teacher_id}, {"_id": 0})
    available = earnings.get("withdrawable_balance", 0) if earnings else 0
    if amount > available:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: RM {available:.2f}")

    payout_id = f"payout_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    new_withdrawable = round(available - amount, 2)

    payout_doc = {
        "payout_id": payout_id,
        "teacher_id": teacher_id,
        "user_id": current_user.user_id,
        "amount": amount,
        "bank_name": bank_name,
        "account_number": account_number,
        "account_holder": account_holder,
        "status": "pending",
        "created_at": now_iso,
    }

    # Withdrawal transaction for the merged transaction feed
    withdrawal_txn = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "teacher_id": teacher_id,
        "transaction_type": "withdrawal",
        "amount": amount,
        "net_amount": amount,
        "description": f"Payout request - {bank_name} ****{account_number[-4:] if len(account_number) >= 4 else account_number}",
        "payout_id": payout_id,
        "status": "pending",
        "created_at": now_iso,
    }

    # ACID: atomic balance deduction + payout record + withdrawal txn creation
    try:
        async with await client.start_session() as session:
            async with session.start_transaction():
                # Re-verify balance inside transaction to prevent race conditions
                fresh = await db.tutor_earnings.find_one(
                    {"teacher_id": teacher_id}, {"_id": 0}, session=session
                )
                if not fresh or fresh.get("withdrawable_balance", 0) < amount:
                    raise HTTPException(status_code=400, detail="Insufficient balance (concurrent update)")
                await db.payout_requests.insert_one(payout_doc, session=session)
                await db.tutor_earnings_transactions.insert_one(withdrawal_txn, session=session)
                await db.tutor_earnings.update_one(
                    {"teacher_id": teacher_id},
                    {"$set": {
                        "withdrawable_balance": round(fresh["withdrawable_balance"] - amount, 2),
                        "pending_withdrawal": fresh.get("pending_withdrawal", 0) + amount,
                        "updated_at": now_iso,
                    },
                    "$inc": {"total_withdrawn": amount}},
                    session=session,
                )
        logger.info(f"ACID payout request {payout_id} for teacher {teacher_id}")
    except HTTPException:
        raise
    except Exception as tx_err:
        logger.warning(f"Transaction not supported, falling back to sequential writes: {tx_err}")
        await db.payout_requests.insert_one(payout_doc)
        await db.tutor_earnings_transactions.insert_one(withdrawal_txn)
        await db.tutor_earnings.update_one(
            {"teacher_id": teacher_id},
            {"$set": {"withdrawable_balance": new_withdrawable, "pending_withdrawal": (earnings.get("pending_withdrawal", 0) + amount), "updated_at": now_iso},
             "$inc": {"total_withdrawn": amount}}
        )

    return {"message": "Payout request submitted", "payout_id": payout_id, "new_withdrawable_balance": new_withdrawable}


# ============== TEACHER ANALYTICS (#10) ==============
@api_router.get("/teacher/analytics")
async def get_teacher_analytics(current_user: User = Depends(get_current_user)):
    """Teacher analytics: daily earnings (30d) and recent rating trend."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
    teacher = await db.teachers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    teacher_id = teacher["teacher_id"]
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()

    # Daily earnings for last 30 days
    daily_pipeline = [
        {"$match": {"teacher_id": teacher_id, "created_at": {"$gte": thirty_days_ago}, "transaction_type": "session_earning"}},
        {"$addFields": {"date_str": {"$substr": ["$created_at", 0, 10]}}},
        {"$group": {"_id": "$date_str", "total": {"$sum": {"$ifNull": ["$net_amount", "$amount"]}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    daily_raw = await db.tutor_earnings_transactions.aggregate(daily_pipeline).to_list(31)
    # Fill missing days
    daily_earnings = []
    for i in range(30, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        found = next((r for r in daily_raw if r["_id"] == d), None)
        daily_earnings.append({"date": d, "earnings": round(found["total"], 2) if found else 0, "sessions": found["count"] if found else 0})

    # Rating trend from last 10 session reports / reviews
    reviews = await db.reviews.find(
        {"teacher_id": teacher_id}, {"_id": 0, "rating": 1, "created_at": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    rating_trend = [{"date": r.get("created_at", "")[:10], "rating": r.get("rating", 0)} for r in reversed(reviews)]

    return {"daily_earnings": daily_earnings, "rating_trend": rating_trend}


# ============== ADMIN SESSION HISTORY (#7) ==============
@api_router.get("/admin/sessions/history")
async def get_admin_session_history(
    status: str = None, limit: int = 20, offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    """Admin: paginated session history from bookings."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    query = {}
    if status and status != "all":
        query["status"] = status
    total = await db.bookings.count_documents(query)
    bookings = await db.bookings.find(query, {"_id": 0}).sort("start_time_utc", -1).skip(offset).limit(limit).to_list(limit)
    # Enrich with names
    for b in bookings:
        if b.get("teacher_id"):
            t = await db.teachers.find_one({"teacher_id": b["teacher_id"]}, {"_id": 0, "user_id": 1})
            if t:
                u = await db.users.find_one({"user_id": t["user_id"]}, {"_id": 0, "name": 1})
                b["teacher_name"] = u.get("name", "Unknown") if u else "Unknown"
        if b.get("student_id"):
            s = await db.students.find_one({"student_id": b["student_id"]}, {"_id": 0, "user_id": 1})
            if s:
                u = await db.users.find_one({"user_id": s["user_id"]}, {"_id": 0, "name": 1})
                b["student_name"] = u.get("name", "Unknown") if u else "Unknown"
        # Attach session report if completed
        if b.get("status") == "completed" and b.get("booking_id"):
            report = await db.session_reports.find_one({"booking_id": b["booking_id"]}, {"_id": 0})
            b["session_report"] = report
    return {"bookings": bookings, "total": total, "limit": limit, "offset": offset}


# ============== ADMIN REVENUE CHART (#9) ==============
@api_router.get("/admin/revenue/chart-data")
async def get_admin_revenue_chart(
    group_by: str = "day",
    current_user: User = Depends(get_current_user),
):
    """Admin: aggregated gross/net revenue for charts."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    now = datetime.now(timezone.utc)
    if group_by == "month":
        since = (now - timedelta(days=365)).isoformat()
        substr_len = 7  # YYYY-MM
    else:
        since = (now - timedelta(days=30)).isoformat()
        substr_len = 10  # YYYY-MM-DD

    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {"$addFields": {"period": {"$substr": ["$created_at", 0, substr_len]}}},
        {"$group": {
            "_id": "$period",
            "gross": {"$sum": "$gross_amount"},
            "net_profit": {"$sum": "$platform_fee"},
            "tutor_payouts": {"$sum": "$net_to_teacher"},
            "sessions": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    raw = await db.admin_revenue.aggregate(pipeline).to_list(366)
    data = [{"period": r["_id"], "gross": round(r["gross"], 2), "net_profit": round(r["net_profit"], 2), "tutor_payouts": round(r["tutor_payouts"], 2), "sessions": r["sessions"]} for r in raw]
    return {"chart_data": data, "group_by": group_by}


app.include_router(api_router)

# Initialize admin routes with database
init_admin_routes(db, get_current_user)
app.include_router(admin_router)

# Initialize notification routes with database
init_notification_routes(db)
app.include_router(notification_router)

# Initialize wallet routes with database
init_wallet_routes(db)
app.include_router(wallet_router)

# Initialize commission routes with database
init_commission_routes(db)
app.include_router(commission_router)

# Initialize tutor earnings routes with database
init_tutor_earnings_routes(db, client)
app.include_router(tutor_earnings_router)

# Initialize booking routes with database
init_booking_routes(db)
app.include_router(booking_router)

# Initialize classroom routes with database
init_classroom_routes(db, get_current_user)
init_quran_routes(db)
init_upload_routes(db)
init_payment_routes(db)
init_credentials(db)
app.include_router(classroom_router)
app.include_router(quran_router)
app.include_router(upload_router)
app.include_router(payment_router)

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

@app.on_event("startup")
async def seed_system_settings():
    """Seed commission tiers into system_settings so admins can adjust them."""
    existing = await db.system_settings.find_one({"key": "commission_tiers"})
    if not existing:
        await db.system_settings.insert_one({
            "key": "commission_tiers",
            "tiers": {
                "new": {"name": "New Tutor", "commission_rate": 0.40, "min_sessions": 0, "min_rating": 0},
                "rated": {"name": "Rated Tutor", "commission_rate": 0.35, "min_sessions": 20, "min_rating": 4.5},
                "elite": {"name": "Elite Tutor", "commission_rate": 0.30, "min_sessions": 100, "min_rating": 4.7},
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
