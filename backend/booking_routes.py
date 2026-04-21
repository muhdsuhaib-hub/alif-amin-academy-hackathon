from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal
from pydantic import BaseModel
import uuid
import logging

from wallet_routes import get_or_create_wallet, get_credits_for_duration, get_base_session_price, add_transaction, BASE_CREDIT_PRICE

booking_router = APIRouter(prefix="/api/booking")
logger = logging.getLogger(__name__)

db = None

def init_booking_routes(database):
    global db
    db = database


# Duration → Credit cost mapping
DURATION_CREDITS = {15: 1, 30: 2, 60: 4}
VALID_DURATIONS = [15, 30, 60]


# ============== REQUEST MODELS ==============

class CreateBookingRequest(BaseModel):
    teacher_id: str
    start_time_utc: str  # ISO format
    duration_minutes: Literal[15, 30, 60]


class EditBookingRequest(BaseModel):
    teacher_id: Optional[str] = None
    start_time_utc: Optional[str] = None
    duration_minutes: Optional[Literal[15, 30, 60]] = None


class CancelBookingRequest(BaseModel):
    confirm_no_refund: bool = False  # Required when cancelling < 24hrs


# ============== HELPER: Get current user ==============

async def get_current_user_from_request(request: Request):
    token = request.cookies.get("session_token")
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
    return user_doc


# ============== ENDPOINTS ==============

@booking_router.post("/create")
async def create_booking(req: CreateBookingRequest, request: Request):
    """
    Create a booking with fixed duration. Deducts credits from wallet upfront.
    """
    user = await get_current_user_from_request(request)
    if user["role"] not in ["student", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Validate duration
    if req.duration_minutes not in VALID_DURATIONS:
        raise HTTPException(status_code=400, detail=f"Invalid duration. Choose from {VALID_DURATIONS}")

    # Get student profile
    student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Parse start time
    try:
        start_time = datetime.fromisoformat(req.start_time_utc.replace("Z", "+00:00"))
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start_time_utc format")

    # Ensure booking is in the future
    if start_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Booking must be in the future")

    end_time = start_time + timedelta(minutes=req.duration_minutes)

    # Validate teacher exists and is active
    teacher = await db.teachers.find_one({"teacher_id": req.teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if not teacher.get("is_active", False):
        raise HTTPException(status_code=400, detail="Teacher is not currently active")

    # HOTFIX 5.8.1: Overlap prevention — check for existing sessions
    overlap = await db.class_sessions.find_one({
        "teacher_id": req.teacher_id,
        "status": "scheduled",
        "start_time_utc": {"$lt": end_time.isoformat()},
        "end_time_utc": {"$gt": start_time.isoformat()},
    })
    if overlap:
        raise HTTPException(
            status_code=409,
            detail="This time slot has just been booked by someone else. Please select another time."
        )

    # Also check the bookings collection for overlap
    booking_overlap = await db.bookings.find_one({
        "teacher_id": req.teacher_id,
        "status": "scheduled",
        "start_time_utc": {"$lt": end_time.isoformat()},
        "end_time_utc": {"$gt": start_time.isoformat()},
    })
    if booking_overlap:
        raise HTTPException(
            status_code=409,
            detail="This time slot has just been booked by someone else. Please select another time."
        )

    # Calculate credits needed
    credits_needed = DURATION_CREDITS[req.duration_minutes]

    # Check wallet balance
    wallet = await get_or_create_wallet(student["student_id"], user["user_id"])
    paid_available = wallet.get("paid_credits", 0)
    bonus_available = wallet.get("bonus_credits", 0)
    total_available = paid_available + bonus_available

    if total_available < credits_needed:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient credits. You have {total_available} credits but need {credits_needed}."
        )

    # Deduct credits: paid first, then bonus
    paid_to_deduct = min(paid_available, credits_needed)
    bonus_to_deduct = credits_needed - paid_to_deduct

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

    # Deduct bonus credit batches (FIFO)
    if bonus_to_deduct > 0:
        from wallet_routes import deduct_from_bonus_batches
        await deduct_from_bonus_batches(wallet["wallet_id"], bonus_to_deduct)

    # Get teacher's name
    teacher_user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
    teacher_name = teacher_user.get("name", "Unknown") if teacher_user else "Unknown"

    # Create booking record
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking_doc = {
        "booking_id": booking_id,
        "student_id": student["student_id"],
        "teacher_id": req.teacher_id,
        "start_time_utc": start_time.isoformat(),
        "end_time_utc": end_time.isoformat(),
        "duration_minutes": req.duration_minutes,
        "credits_charged": credits_needed,
        "paid_credits_charged": paid_to_deduct,
        "bonus_credits_charged": bonus_to_deduct,
        "status": "scheduled",
        "booking_type": "paid",
        "teacher_name": teacher_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)

    # Add wallet transaction
    await add_transaction(
        wallet_id=wallet["wallet_id"],
        student_id=student["student_id"],
        transaction_type="session_deduction",
        credit_amount=-credits_needed,
        description=f"Booking: {req.duration_minutes} min session with {teacher_name}",
        monetary_value=get_base_session_price(req.duration_minutes),
        reference_id=booking_id
    )

    # === Create ClassSession (Virtual Classroom) ===
    session_id = f"cs_{uuid.uuid4().hex[:12]}"
    meet_link_slug = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.class_sessions.insert_one({
        "session_id": session_id,
        "teacher_id": req.teacher_id,
        "student_id": student["student_id"],
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

    # Create notification for teacher
    notif_id = f"notif_{uuid.uuid4().hex[:12]}"
    student_user_name = user.get("name", "A student")
    await db.notifications.insert_one({
        "notification_id": notif_id,
        "user_id": teacher["user_id"],
        "title": "New Booking",
        "message": f"{student_user_name} booked a {req.duration_minutes}-minute session on {start_time.strftime('%b %d at %I:%M %p')}.",
        "notification_type": "booking_confirmed",
        "related_id": booking_id,
        "is_read": False,
        "created_at": now_iso
    })

    return {
        "success": True,
        "booking_id": booking_id,
        "session_id": session_id,
        "meet_link_slug": meet_link_slug,
        "booking": {
            "booking_id": booking_id,
            "session_id": session_id,
            "teacher_name": teacher_name,
            "start_time_utc": start_time.isoformat(),
            "end_time_utc": end_time.isoformat(),
            "duration_minutes": req.duration_minutes,
            "credits_charged": credits_needed,
            "status": "scheduled"
        },
        "wallet_balance": {
            "total": new_balance,
            "paid": new_paid,
            "bonus": new_bonus
        }
    }


@booking_router.get("/my-bookings")
async def get_my_bookings(request: Request, status: Optional[str] = None):
    """Get student's bookings with enriched teacher data."""
    user = await get_current_user_from_request(request)

    student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not student:
        return {"bookings": []}

    query = {"student_id": student["student_id"]}
    if status:
        query["status"] = status
    else:
        # Default: only upcoming/active bookings (not completed/missed/cancelled)
        query["status"] = {"$in": ["scheduled", "live"]}

    bookings = await db.bookings.find(query, {"_id": 0}).sort("start_time_utc", -1).to_list(200)

    enriched = []
    for b in bookings:
        teacher = await db.teachers.find_one({"teacher_id": b.get("teacher_id")}, {"_id": 0})
        teacher_user = None
        if teacher:
            teacher_user = await db.users.find_one({"user_id": teacher.get("user_id")}, {"_id": 0})

        enriched.append({
            **b,
            "teacher_name": b.get("teacher_name") or (teacher_user.get("name") if teacher_user else "Unknown"),
            "duration_minutes": b.get("duration_minutes", 30),
            "credits_charged": b.get("credits_charged", 0),
        })

    return {"bookings": enriched}


@booking_router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: str, req: CancelBookingRequest, request: Request):
    """
    Cancel a booking with 24-hour refund policy.
    - 24+ hours notice: full credit refund
    - <24 hours: no refund (requires confirm_no_refund=True)
    """
    user = await get_current_user_from_request(request)
    student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["student_id"] != student["student_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    if booking["status"] != "scheduled":
        raise HTTPException(status_code=400, detail=f"Cannot cancel a booking with status '{booking['status']}'")

    # Parse start time
    start_time = datetime.fromisoformat(booking["start_time_utc"])
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    hours_until_class = (start_time - now).total_seconds() / 3600
    is_within_24h = hours_until_class < 24

    # If within 24 hours, require explicit confirmation
    if is_within_24h and not req.confirm_no_refund:
        return {
            "requires_confirmation": True,
            "message": "This class is within 24 hours. Credits will NOT be refunded.",
            "hours_until_class": round(hours_until_class, 1)
        }

    # Cancel the booking
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": now.isoformat(),
            "refunded": not is_within_24h
        }}
    )

    refund_info = {"refunded": False, "credits_refunded": 0}

    # Refund credits if 24+ hours notice
    if not is_within_24h:
        credits_to_refund = booking.get("credits_charged", 0)
        paid_refund = booking.get("paid_credits_charged", 0)
        bonus_refund = booking.get("bonus_credits_charged", 0)

        # If old bookings don't have split, refund all as paid
        if paid_refund == 0 and bonus_refund == 0 and credits_to_refund > 0:
            paid_refund = credits_to_refund

        if credits_to_refund > 0:
            wallet = await get_or_create_wallet(student["student_id"], user["user_id"])
            new_paid = wallet.get("paid_credits", 0) + paid_refund
            new_bonus = wallet.get("bonus_credits", 0) + bonus_refund
            new_balance = new_paid + new_bonus

            await db.student_wallets.update_one(
                {"wallet_id": wallet["wallet_id"]},
                {"$set": {
                    "credit_balance": new_balance,
                    "paid_credits": new_paid,
                    "bonus_credits": new_bonus,
                    "updated_at": now.isoformat()
                }}
            )

            # Add refund transaction
            await add_transaction(
                wallet_id=wallet["wallet_id"],
                student_id=student["student_id"],
                transaction_type="refund_paid",
                credit_amount=credits_to_refund,
                description="Refund: Cancelled booking (24+ hrs notice)",
                monetary_value=credits_to_refund * BASE_CREDIT_PRICE,
                reference_id=booking_id
            )

            refund_info = {
                "refunded": True,
                "credits_refunded": credits_to_refund,
                "paid_credits_refunded": paid_refund,
                "bonus_credits_refunded": bonus_refund
            }

    # Notify teacher
    teacher = await db.teachers.find_one({"teacher_id": booking.get("teacher_id")}, {"_id": 0})
    if teacher:
        notif_id = f"notif_{uuid.uuid4().hex[:12]}"
        student_name = user.get("name", "A student")
        await db.notifications.insert_one({
            "notification_id": notif_id,
            "user_id": teacher["user_id"],
            "title": "Booking Cancelled",
            "message": f"{student_name} cancelled their session on {start_time.strftime('%b %d at %I:%M %p')}.",
            "notification_type": "booking_cancelled",
            "related_id": booking_id,
            "is_read": False,
            "created_at": now.isoformat()
        })

    return {
        "success": True,
        "booking_id": booking_id,
        "status": "cancelled",
        "within_24h": is_within_24h,
        **refund_info
    }


@booking_router.put("/{booking_id}/edit")
async def edit_booking(booking_id: str, req: EditBookingRequest, request: Request):
    """
    Edit an existing booking. Can change teacher, date/time, and duration.
    If duration changes, credits are adjusted (refund old, charge new).
    """
    user = await get_current_user_from_request(request)
    student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["student_id"] != student["student_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if booking["status"] != "scheduled":
        raise HTTPException(status_code=400, detail="Only scheduled bookings can be edited")

    update_fields = {}
    now = datetime.now(timezone.utc)
    old_credits = booking.get("credits_charged", 0)
    new_duration = req.duration_minutes or booking.get("duration_minutes", 30)
    new_credits = DURATION_CREDITS.get(new_duration, 2)

    # Handle time change
    if req.start_time_utc:
        try:
            new_start = datetime.fromisoformat(req.start_time_utc.replace("Z", "+00:00"))
            if new_start.tzinfo is None:
                new_start = new_start.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_time_utc format")

        if new_start <= now:
            raise HTTPException(status_code=400, detail="New time must be in the future")

        new_end = new_start + timedelta(minutes=new_duration)
        update_fields["start_time_utc"] = new_start.isoformat()
        update_fields["end_time_utc"] = new_end.isoformat()
    elif req.duration_minutes and req.duration_minutes != booking.get("duration_minutes"):
        # Duration changed but not start time - recalculate end time
        start = datetime.fromisoformat(booking["start_time_utc"])
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        new_end = start + timedelta(minutes=new_duration)
        update_fields["end_time_utc"] = new_end.isoformat()

    # Handle teacher change
    if req.teacher_id and req.teacher_id != booking.get("teacher_id"):
        new_teacher = await db.teachers.find_one({"teacher_id": req.teacher_id}, {"_id": 0})
        if not new_teacher:
            raise HTTPException(status_code=404, detail="New teacher not found")
        if not new_teacher.get("is_active", False):
            raise HTTPException(status_code=400, detail="New teacher is not active")

        teacher_user = await db.users.find_one({"user_id": new_teacher["user_id"]}, {"_id": 0})
        update_fields["teacher_id"] = req.teacher_id
        update_fields["teacher_name"] = teacher_user.get("name", "Unknown") if teacher_user else "Unknown"

    if req.duration_minutes:
        update_fields["duration_minutes"] = new_duration

    # Handle credit adjustment if duration changed
    credit_diff = new_credits - old_credits
    if credit_diff != 0:
        wallet = await get_or_create_wallet(student["student_id"], user["user_id"])

        if credit_diff > 0:
            # Need more credits
            total_available = wallet.get("paid_credits", 0) + wallet.get("bonus_credits", 0)
            if total_available < credit_diff:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient credits for upgrade. Need {credit_diff} more credits."
                )
            # Deduct additional credits
            paid_avail = wallet.get("paid_credits", 0)
            paid_deduct = min(paid_avail, credit_diff)
            bonus_deduct = credit_diff - paid_deduct

            await db.student_wallets.update_one(
                {"wallet_id": wallet["wallet_id"]},
                {"$set": {
                    "credit_balance": wallet["credit_balance"] - credit_diff,
                    "paid_credits": paid_avail - paid_deduct,
                    "bonus_credits": wallet.get("bonus_credits", 0) - bonus_deduct,
                    "updated_at": now.isoformat()
                }}
            )

            await add_transaction(
                wallet_id=wallet["wallet_id"],
                student_id=student["student_id"],
                transaction_type="session_deduction",
                credit_amount=-credit_diff,
                description=f"Edit booking: duration upgrade ({booking.get('duration_minutes', 30)} → {new_duration} min)",
                reference_id=booking_id
            )
        else:
            # Refund excess credits
            refund_amount = abs(credit_diff)
            await db.student_wallets.update_one(
                {"wallet_id": wallet["wallet_id"]},
                {"$set": {
                    "credit_balance": wallet["credit_balance"] + refund_amount,
                    "paid_credits": wallet.get("paid_credits", 0) + refund_amount,
                    "updated_at": now.isoformat()
                }}
            )

            await add_transaction(
                wallet_id=wallet["wallet_id"],
                student_id=student["student_id"],
                transaction_type="refund_paid",
                credit_amount=refund_amount,
                description=f"Edit booking: duration downgrade ({booking.get('duration_minutes', 30)} → {new_duration} min)",
                reference_id=booking_id
            )

        update_fields["credits_charged"] = new_credits

    if not update_fields:
        raise HTTPException(status_code=400, detail="No changes provided")

    update_fields["updated_at"] = now.isoformat()

    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": update_fields}
    )

    # Get updated booking
    updated = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})

    return {
        "success": True,
        "booking": updated
    }


@booking_router.get("/available-teachers")
async def get_available_teachers(request: Request, date: Optional[str] = None, time: Optional[str] = None, duration: int = 30):
    """
    Get list of teachers available for a specific date, time, and duration.
    Performs strict intersection: only returns teachers with an unbooked
    availability_slot matching the requested date+time, AND no overlapping
    existing bookings for the full duration.
    """
    if not date or not time:
        return {"teachers": []}

    slot_start = f"{date}T{time}"

    # Find availability slots that match this date and contain the requested time
    matching_slots = await db.availability_slots.find(
        {
            "date": date,
            "start_time": {"$lte": slot_start},
            "is_booked": {"$ne": True},
        },
        {"_id": 0}
    ).to_list(500)

    available_teacher_ids = set()
    for slot in matching_slots:
        s_start = slot.get("start_time", "")
        s_end = slot.get("end_time", "")
        if s_start <= slot_start < s_end:
            available_teacher_ids.add(slot["teacher_id"])

    if not available_teacher_ids:
        return {"teachers": []}

    # Overlap filter: exclude teachers with existing bookings that overlap
    try:
        start_dt = datetime.fromisoformat(f"{date}T{time}:00+00:00")
        end_dt = start_dt + timedelta(minutes=duration)
        start_iso = start_dt.isoformat()
        end_iso = end_dt.isoformat()

        # Check both bookings and class_sessions for overlaps
        for collection_name in ["bookings", "class_sessions"]:
            col = db[collection_name]
            overlapping = await col.find(
                {
                    "teacher_id": {"$in": list(available_teacher_ids)},
                    "status": "scheduled",
                    "start_time_utc": {"$lt": end_iso},
                    "end_time_utc": {"$gt": start_iso},
                },
                {"_id": 0, "teacher_id": 1}
            ).to_list(500)
            for o in overlapping:
                available_teacher_ids.discard(o["teacher_id"])
    except Exception:
        pass  # If date parsing fails, skip overlap filter

    if not available_teacher_ids:
        return {"teachers": []}

    # Fetch teacher details
    result = []
    for teacher_id in available_teacher_ids:
        t = await db.teachers.find_one(
            {"teacher_id": teacher_id, "is_active": True, "approval_status": "approved"},
            {"_id": 0}
        )
        if not t:
            continue
        user_doc = await db.users.find_one({"user_id": t["user_id"]}, {"_id": 0})
        if user_doc:
            result.append({
                "teacher_id": t["teacher_id"],
                "name": user_doc.get("name", "Unknown"),
                "picture": user_doc.get("picture"),
                "bio": t.get("bio", ""),
                "specializations": t.get("specializations", []),
                "rating": t.get("rating", 0),
                "total_reviews": t.get("total_reviews", 0),
                "total_classes": t.get("total_classes", 0),
                "video_intro": t.get("video_intro", ""),
                "certificates": t.get("certificates", []),
            })

    return {"teachers": result}
