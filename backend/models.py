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


# Notification Models
class Notification(BaseModel):
    notification_id: str
    user_id: str
    title: str
    message: str
    notification_type: Literal[
        "upcoming_class", "class_reminder", "booking_confirmed", "booking_cancelled",
        "no_upcoming_class", "leave_note_reminder", "earning_credited",
        "withdrawal_request", "new_registration", "class_reschedule",
        "teacher_approved", "teacher_pending", "system"
    ]
    related_id: Optional[str] = None  # booking_id, teacher_id, student_id, etc.
    is_read: bool = False
    created_at: datetime


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    notification_type: str
    related_id: Optional[str] = None


# Wallet and Credit System Models
class StudentWallet(BaseModel):
    wallet_id: str
    student_id: str
    user_id: str
    credit_balance: float = 0.0  # Credits available
    total_topup_amount: float = 0.0  # Total RM topped up ever
    total_credits_purchased: float = 0.0  # Total credits ever purchased
    total_credits_used: float = 0.0  # Total credits ever used
    created_at: datetime
    updated_at: datetime


class WalletTransaction(BaseModel):
    transaction_id: str
    wallet_id: str
    student_id: str
    transaction_type: Literal["topup", "session_deduction", "refund", "bonus", "subscription_credit"]
    credits: float  # Positive for additions, negative for deductions
    amount_myr: Optional[float] = None  # RM amount for top-ups
    description: str
    reference_id: Optional[str] = None  # booking_id, payment_id, etc.
    status: Literal["pending", "completed", "failed", "refunded"] = "completed"
    created_at: datetime


class TopupPackage(BaseModel):
    package_id: str
    name: str
    price_myr: float
    credits: float
    bonus_credits: float = 0.0
    is_active: bool = True


class StripePaymentIntent(BaseModel):
    payment_intent_id: str
    wallet_id: str
    student_id: str
    amount_myr: float
    credits_to_add: float
    package_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    stripe_client_secret: Optional[str] = None
    status: Literal["created", "processing", "succeeded", "failed", "cancelled"] = "created"
    created_at: datetime
    completed_at: Optional[datetime] = None

