from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict
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

# Commission Tier Levels
COMMISSION_TIERS = {
    "new": {
        "level": 1,
        "name": "New Tutor",
        "commission_rate": 0.30,
        "badge": "new",
        "requirements": "Default tier for all new tutors"
    },
    "rated": {
        "level": 2,
        "name": "Rated Tutor",
        "commission_rate": 0.25,
        "badge": "rated",
        "requirements": "4.5+ rating with 20+ reviews"
    },
    "elite": {
        "level": 3,
        "name": "Elite Tutor",
        "commission_rate": 0.20,
        "badge": "elite",
        "requirements": "100+ sessions with 4.7+ rating"
    }
}

class Teacher(BaseModel):
    teacher_id: str
    user_id: str
    bio: Optional[str] = None
    specializations: List[str] = []
    years_experience: int = 0
    is_active: bool = True
    rating: float = 0.0
    total_classes: int = 0
    # Commission Tier Fields
    tier_level: Literal["new", "rated", "elite"] = "new"
    commission_rate: float = 0.30  # Default 30%
    total_completed_sessions: int = 0
    average_rating: float = 0.0
    total_reviews: int = 0
    tier_last_evaluated: Optional[datetime] = None
    tier_history: List[dict] = []  # Track tier changes for audit


class TierEvaluationResult(BaseModel):
    teacher_id: str
    previous_tier: str
    new_tier: str
    previous_commission: float
    new_commission: float
    reason: str
    metrics: dict
    evaluated_at: datetime

class TeacherCreate(BaseModel):
    user_id: str
    bio: Optional[str] = None
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
    link: Optional[str] = None  # Frontend route to navigate to
    action_required: bool = False  # Indicates if user action is needed
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
        "bonus_expired",  # Expired bonus credits
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


# Bonus Credit Tracking (for expiry management)
class BonusCreditBatch(BaseModel):
    batch_id: str
    wallet_id: str
    student_id: str
    credit_amount: float  # Original bonus credits in this batch
    remaining_credits: float  # Credits not yet used or expired
    source: str  # "topup_bonus", "bonus_reward", etc.
    reference_id: Optional[str] = None  # payment_intent_id, promo_code, etc.
    issued_at: datetime
    expires_at: datetime  # 12 months from issued_at
    is_expired: bool = False
    expired_credits: float = 0.0  # Credits that expired without being used


# ============== TUTOR EARNINGS WALLET MODELS ==============

class TutorEarnings(BaseModel):
    """
    Tracks tutor earnings from completed sessions.
    Commission is ALREADY deducted before earnings are added.
    """
    earnings_id: str
    teacher_id: str
    user_id: str
    total_earnings: float = 0.0  # Total lifetime earnings (after commission)
    pending_earnings: float = 0.0  # Earnings from sessions not yet withdrawable (e.g., 7-day hold)
    withdrawable_balance: float = 0.0  # Available for withdrawal
    total_withdrawn: float = 0.0  # Total amount withdrawn
    pending_withdrawal: float = 0.0  # Amount in pending withdrawal requests
    created_at: datetime
    updated_at: datetime


class TutorEarningsTransaction(BaseModel):
    """
    Transaction record for tutor earnings wallet.
    """
    transaction_id: str
    earnings_id: str
    teacher_id: str
    transaction_type: Literal[
        "session_earning",  # Earnings from a completed session
        "withdrawal_request",  # Withdrawal request created
        "withdrawal_approved",  # Withdrawal paid out
        "withdrawal_rejected",  # Withdrawal rejected (funds returned)
        "pending_to_available",  # Pending earnings become available
        "adjustment"  # Manual adjustment by admin
    ]
    amount: float  # Positive for additions, negative for deductions
    balance_after: float  # Withdrawable balance after this transaction
    description: str
    reference_id: Optional[str] = None  # booking_id, withdrawal_id, etc.
    session_payment_record_id: Optional[str] = None  # Link to session payment
    created_at: datetime


class WithdrawalRequest(BaseModel):
    """
    Withdrawal request from tutor.
    """
    withdrawal_id: str
    teacher_id: str
    user_id: str
    amount: float
    bank_name: str
    account_number: str
    account_holder_name: str
    status: Literal["pending", "approved", "rejected", "processing", "completed"] = "pending"
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    processed_by: Optional[str] = None  # Admin user_id who processed
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ============== VIRTUAL CLASSROOM MODELS ==============

class ClassSession(BaseModel):
    session_id: str
    teacher_id: str
    student_id: str
    booking_id: Optional[str] = None
    slot_id: Optional[str] = None
    start_time_utc: datetime
    end_time_utc: datetime
    status: Literal["booked", "live", "completed", "cancelled"] = "booked"
    meet_link_slug: str  # UUID room identifier
    recording_url: Optional[str] = None
    recording_visibility: Literal["public", "hidden"] = "hidden"
    created_at: datetime
    updated_at: datetime


class ClassSessionCreate(BaseModel):
    teacher_id: str
    student_id: str
    booking_id: Optional[str] = None
    slot_id: Optional[str] = None
    start_time_utc: str
    end_time_utc: str


class StudentProgressRecord(BaseModel):
    progress_id: str
    session_id: str
    student_id: str
    teacher_id: str
    surah_name: str
    ayah_start: int
    ayah_end: int
    track_type: Literal["Memorization (Hifz)", "Revision (Murajaah)", "Recitation (Nazra)"]
    grading: Dict[str, int]  # {fluency_score: 1-10, tajweed_score: 1-10, makhraj_score: 1-10}
    teacher_comments: Optional[str] = None
    created_at: datetime


class StudentProgressCreate(BaseModel):
    session_id: Optional[str] = None  # Optional since it's provided via URL path
    material_type: Optional[str] = "quran"  # "quran" or "iqra"
    surah_name: Optional[str] = None
    ayah_start: Optional[int] = None
    ayah_end: Optional[int] = None
    iqra_book: Optional[int] = None  # 1-6
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    track_type: Literal["Memorization (Hifz)", "Revision (Murajaah)", "Recitation (Nazra)"]
    grading: Dict[str, int]
    teacher_comments: Optional[str] = None


class InteractiveActivity(BaseModel):
    activity_id: str
    title: str
    activity_type: Literal["quiz", "flashcard"]
    content: dict  # Flexible JSON for quiz questions or flashcard data
    surah_name: Optional[str] = None
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    created_by: str  # admin user_id
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class InteractiveActivityCreate(BaseModel):
    title: str
    activity_type: Literal["quiz", "flashcard"]
    content: dict
    surah_name: Optional[str] = None
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"

