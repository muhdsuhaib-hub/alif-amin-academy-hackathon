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
    credit_balance: float = 0.0  # Total credits available (paid + bonus)
    paid_credits: float = 0.0  # Credits from actual payments
    bonus_credits: float = 0.0  # Marketing/promotional credits
    total_topup_amount: float = 0.0  # Total RM topped up ever
    total_paid_credits_purchased: float = 0.0  # Total paid credits ever purchased
    total_bonus_credits_received: float = 0.0  # Total bonus credits ever received
    total_credits_used: float = 0.0  # Total credits ever used
    created_at: datetime
    updated_at: datetime


class WalletTransaction(BaseModel):
    transaction_id: str
    wallet_id: str
    student_id: str
    transaction_type: Literal[
        "topup_paid",  # Paid credits from top-up
        "topup_bonus",  # Bonus credits from top-up
        "session_deduction",  # Credits used for a session
        "refund_paid",  # Refund of paid credits
        "refund_bonus",  # Refund of bonus credits
        "bonus_reward",  # Promotional bonus credits
        "subscription_credit"  # Subscription-based credits
    ]
    credit_amount: float  # Positive for additions, negative for deductions
    monetary_value: Optional[float] = None  # RM equivalent at base rate (RM15/credit)
    payment_amount: Optional[float] = None  # Actual RM paid (for top-ups)
    description: str
    reference_id: Optional[str] = None  # booking_id, payment_id, etc.
    status: Literal["pending", "completed", "failed", "refunded"] = "completed"
    created_at: datetime


class TopupPackage(BaseModel):
    package_id: str
    name: str
    price_myr: float
    paid_credits: float  # Credits directly from payment
    bonus_credits: float = 0.0  # Promotional bonus credits
    total_credits: float  # paid_credits + bonus_credits
    is_active: bool = True


class StripePaymentIntent(BaseModel):
    payment_intent_id: str
    wallet_id: str
    student_id: str
    amount_myr: float
    paid_credits_to_add: float
    bonus_credits_to_add: float
    package_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    stripe_client_secret: Optional[str] = None
    status: Literal["created", "processing", "succeeded", "failed", "cancelled"] = "created"
    created_at: datetime
    completed_at: Optional[datetime] = None


# Session Payment Record (for commission tracking)
class SessionPaymentRecord(BaseModel):
    record_id: str
    booking_id: str
    student_id: str
    teacher_id: str
    duration_minutes: int
    credits_used: float
    paid_credits_used: float
    bonus_credits_used: float
    base_session_price: float  # Always calculated from duration, not from credit cost
    commission_rate: float  # e.g., 0.20 for 20%
    tutor_payout: float  # base_session_price × (1 - commission_rate)
    platform_commission: float  # base_session_price × commission_rate
    platform_marketing_cost: float  # Value of bonus credits used (absorbed by platform)
    created_at: datetime
