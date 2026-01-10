from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
import uuid

# User Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    role: Literal["student", "teacher", "admin"]
    picture: Optional[str] = None
    timezone: str = "UTC"
    phone: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

# Teacher Models
class Teacher(BaseModel):
    teacher_id: str
    user_id: str
    bio: Optional[str] = None
    hourly_rate: float
    meet_link: Optional[str] = None
    specializations: List[str] = []
    years_experience: int = 0
    is_active: bool = True
    rating: float = 0.0
    total_classes: int = 0

class TeacherCreate(BaseModel):
    user_id: str
    bio: Optional[str] = None
    hourly_rate: float
    meet_link: Optional[str] = None
    specializations: List[str] = []
    years_experience: int = 0

# Student Models
class Student(BaseModel):
    student_id: str
    user_id: str
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    current_level: str = "Beginner"
    subscription_status: Literal["active", "inactive", "trial"] = "inactive"
    subscription_plan: Optional[str] = None
    next_billing_date: Optional[datetime] = None

class StudentCreate(BaseModel):
    user_id: str
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    current_level: str = "Beginner"

# Availability Models
class AvailabilitySlot(BaseModel):
    slot_id: str
    teacher_id: str
    start_time_utc: datetime
    end_time_utc: datetime
    is_booked: bool = False
    recurring: bool = False
    recurrence_pattern: Optional[str] = None

class AvailabilityCreate(BaseModel):
    teacher_id: str
    start_time_utc: datetime
    end_time_utc: datetime
    recurring: bool = False
    recurrence_pattern: Optional[str] = None

# Booking Models
class Booking(BaseModel):
    booking_id: str
    student_id: str
    teacher_id: str
    start_time_utc: datetime
    end_time_utc: datetime
    status: Literal["scheduled", "completed", "cancelled", "no_show"] = "scheduled"
    booking_type: Literal["trial", "paid"] = "paid"
    meet_link: Optional[str] = None
    created_at: datetime
    cancelled_at: Optional[datetime] = None

class BookingCreate(BaseModel):
    student_id: str
    teacher_id: str
    start_time_utc: datetime
    end_time_utc: datetime
    booking_type: Literal["trial", "paid"] = "paid"

# Lesson Models
class Lesson(BaseModel):
    lesson_id: str
    booking_id: str
    teacher_notes: Optional[str] = None
    homework: Optional[str] = None
    attendance_status: Literal["present", "absent", "late"] = "present"
    surah_covered: Optional[str] = None
    verses_covered: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class LessonCreate(BaseModel):
    booking_id: str
    teacher_notes: Optional[str] = None
    homework: Optional[str] = None
    attendance_status: Literal["present", "absent", "late"] = "present"
    surah_covered: Optional[str] = None
    verses_covered: Optional[str] = None

# Progress Models
class Progress(BaseModel):
    progress_id: str
    student_id: str
    current_surah: str = "Al-Fatiha"
    current_surah_number: int = 1
    verses_completed: int = 0
    total_verses_in_surah: int = 7
    completion_percentage: float = 0.0
    total_classes_taken: int = 0
    updated_at: datetime

# Payment/Subscription Models
class Subscription(BaseModel):
    subscription_id: str
    student_id: str
    plan_name: str
    plan_price: float
    billing_cycle: Literal["monthly", "quarterly", "annual"] = "monthly"
    status: Literal["active", "cancelled", "expired"] = "active"
    start_date: datetime
    next_billing_date: datetime
    created_at: datetime

class Payment(BaseModel):
    payment_id: str
    student_id: str
    amount: float
    currency: str = "MYR"
    status: Literal["pending", "completed", "failed"] = "pending"
    payment_method: str = "billplz"
    transaction_id: Optional[str] = None
    created_at: datetime
