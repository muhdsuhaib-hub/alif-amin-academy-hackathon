from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone, timedelta
from typing import Optional
from models import ClassSessionCreate, StudentProgressCreate, InteractiveActivityCreate
from livekit import api as livekit_api
import uuid
import os
import json
import asyncio
import logging

classroom_router = APIRouter(prefix="/api/classroom")
logger = logging.getLogger(__name__)

db = None
get_current_user = None


def init_classroom_routes(database, auth_dependency):
    global db, get_current_user
    db = database
    get_current_user = auth_dependency


# ============== HELPERS ==============

async def _get_user(request: Request):
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


# ============== NEXT CLASS + JOIN VALIDATION ==============

@classroom_router.get("/next-class")
async def get_next_class(request: Request):
    """
    Returns the user's next upcoming class session with is_joinable flag.
    Join is allowed if current_time is between (start_time - 5min) and end_time.
    """
    user = await _get_user(request)
    now = datetime.now(timezone.utc)
    role = user.get("role")

    if role == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if not teacher:
            return {"session": None}
        query = {"teacher_id": teacher["teacher_id"], "status": {"$in": ["booked", "live"]}}
    elif role == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if not student:
            return {"session": None}
        query = {"student_id": student["student_id"], "status": {"$in": ["booked", "live"]}}
    elif role == "admin":
        query = {"status": {"$in": ["booked", "live"]}}
    else:
        return {"session": None}

    session = await db.class_sessions.find_one(
        {**query, "start_time_utc": {"$gte": (now - timedelta(hours=2)).isoformat()}},
        {"_id": 0},
        sort=[("start_time_utc", 1)]
    )

    if not session:
        return {"session": None}

    start = datetime.fromisoformat(session["start_time_utc"])
    end = datetime.fromisoformat(session["end_time_utc"])
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    join_window_start = start - timedelta(minutes=5)
    is_joinable = join_window_start <= now <= end

    # Enrich with participant names
    teacher_doc = await db.teachers.find_one({"teacher_id": session["teacher_id"]}, {"_id": 0})
    teacher_user = await db.users.find_one({"user_id": teacher_doc["user_id"]}, {"_id": 0, "name": 1, "picture": 1}) if teacher_doc else None
    student_doc = await db.students.find_one({"student_id": session["student_id"]}, {"_id": 0})
    student_user = await db.users.find_one({"user_id": student_doc["user_id"]}, {"_id": 0, "name": 1, "picture": 1}) if student_doc else None

    return {
        "session": {
            "session_id": session["session_id"],
            "teacher_id": session["teacher_id"],
            "student_id": session["student_id"],
            "booking_id": session.get("booking_id"),
            "start_time_utc": session["start_time_utc"],
            "end_time_utc": session["end_time_utc"],
            "status": session["status"],
            "meet_link_slug": session["meet_link_slug"],
            "teacher_name": teacher_user.get("name") if teacher_user else "Unknown",
            "teacher_picture": teacher_user.get("picture") if teacher_user else None,
            "student_name": student_user.get("name") if student_user else "Unknown",
            "student_picture": student_user.get("picture") if student_user else None,
        },
        "is_joinable": is_joinable,
        "join_window_start": join_window_start.isoformat(),
        "join_window_end": end.isoformat(),
        "server_time": now.isoformat(),
    }


@classroom_router.get("/session/{session_id}")
async def get_session_details(session_id: str, request: Request):
    """Get full session details for the classroom view."""
    user = await _get_user(request)
    session = await db.class_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    role = user.get("role")
    if role == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if not teacher or teacher["teacher_id"] != session["teacher_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif role == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if not student or student["student_id"] != session["student_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    teacher_doc = await db.teachers.find_one({"teacher_id": session["teacher_id"]}, {"_id": 0})
    teacher_user = await db.users.find_one({"user_id": teacher_doc["user_id"]}, {"_id": 0, "name": 1, "picture": 1}) if teacher_doc else None
    student_doc = await db.students.find_one({"student_id": session["student_id"]}, {"_id": 0})
    student_user = await db.users.find_one({"user_id": student_doc["user_id"]}, {"_id": 0, "name": 1, "picture": 1}) if student_doc else None

    # Resolve end_time_utc from booking duration
    booking = await db.bookings.find_one({"booking_id": session.get("booking_id")}, {"_id": 0, "duration_minutes": 1})
    duration_mins = booking.get("duration_minutes", 30) if booking else 30
    start_str = session.get("start_time_utc", "")
    try:
        start_dt = datetime.fromisoformat(str(start_str).replace("Z", "+00:00"))
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        end_dt = start_dt + timedelta(minutes=duration_mins)
        end_time_utc = end_dt.isoformat()
    except (ValueError, TypeError):
        end_time_utc = session.get("end_time_utc", "")

    return {
        **session,
        "teacher_name": teacher_user.get("name") if teacher_user else "Unknown",
        "teacher_picture": teacher_user.get("picture") if teacher_user else None,
        "student_name": student_user.get("name") if student_user else "Unknown",
        "student_picture": student_user.get("picture") if student_user else None,
        "server_time_utc": datetime.now(timezone.utc).isoformat(),
        "end_time_utc": end_time_utc,
        "duration_minutes": duration_mins,
    }


@classroom_router.post("/session/{session_id}/go-live")
async def go_live(session_id: str, request: Request):
    """Teacher marks session as live when joining."""
    user = await _get_user(request)
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can start class")

    session = await db.class_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not teacher or teacher["teacher_id"] != session["teacher_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.class_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "live", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "live", "session_id": session_id}


# ============== SESSION CREATION ==============

@classroom_router.post("/sessions/create")
async def create_class_session(data: ClassSessionCreate, request: Request):
    """Create a class session. Validates via Pydantic ClassSessionCreate model."""
    await _get_user(request)

    now = datetime.now(timezone.utc)
    session_id = f"cs_{uuid.uuid4().hex[:12]}"
    meet_link_slug = str(uuid.uuid4())

    session_doc = {
        "session_id": session_id,
        "teacher_id": data.teacher_id,
        "student_id": data.student_id,
        "booking_id": data.booking_id,
        "slot_id": data.slot_id,
        "start_time_utc": data.start_time_utc,
        "end_time_utc": data.end_time_utc,
        "status": "booked",
        "meet_link_slug": meet_link_slug,
        "recording_url": None,
        "recording_visibility": "hidden",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    await db.class_sessions.insert_one(session_doc)

    return {
        "session_id": session_id,
        "meet_link_slug": meet_link_slug,
        "status": "booked",
    }


# ============== STUDENT PROGRESS ==============

@classroom_router.post("/session/{session_id}/progress")
async def submit_progress(session_id: str, data: StudentProgressCreate, request: Request):
    """Teacher submits student progress. Validates via Pydantic StudentProgressCreate model."""
    user = await _get_user(request)
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can submit progress")

    session = await db.class_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not teacher or teacher["teacher_id"] != session["teacher_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    now = datetime.now(timezone.utc)
    progress_id = f"sp_{uuid.uuid4().hex[:12]}"

    progress_doc = {
        "progress_id": progress_id,
        "session_id": session_id,
        "student_id": session["student_id"],
        "teacher_id": session["teacher_id"],
        "surah_name": data.surah_name,
        "ayah_start": data.ayah_start,
        "ayah_end": data.ayah_end,
        "track_type": data.track_type,
        "grading": data.grading,
        "teacher_comments": data.teacher_comments,
        "created_at": now.isoformat(),
    }
    await db.student_progress.insert_one(progress_doc)

    # Mark session completed
    await db.class_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "completed", "updated_at": now.isoformat()}}
    )

    if session.get("booking_id"):
        booking = await db.bookings.find_one({"booking_id": session["booking_id"]}, {"_id": 0})

        # Idempotency guard — skip if already paid out
        if booking and booking.get("payment_status") == "payout_done":
            logger.info(f"Earnings already processed for booking {session['booking_id']}, skipping")
        elif booking:
            await db.bookings.update_one(
                {"booking_id": session["booking_id"]},
                {"$set": {"status": "completed"}}
            )

            # REVENUE TRIGGER: Credit teacher earnings (NO student deduction — already charged at booking time)
            try:
                # Check session_payment_records for duplicate safety
                existing_record = await db.session_payment_records.find_one({"booking_id": session["booking_id"]})
                if existing_record:
                    logger.info(f"Payment record already exists for booking {session['booking_id']}, skipping payout")
                else:
                    from wallet_routes import get_base_session_price, get_credits_for_duration
                    from commission_routes import get_tutor_commission_rate

                    duration = booking.get("duration_minutes", 30)
                    base_price = get_base_session_price(duration)
                    commission_rate = await get_tutor_commission_rate(session["teacher_id"])
                    tutor_payout = round(base_price * (1 - commission_rate), 2)
                    platform_commission = round(base_price * commission_rate, 2)

                    teacher_data = await db.teachers.find_one({"teacher_id": session["teacher_id"]}, {"_id": 0})
                    teacher_tier = teacher_data.get("tier_level", "new") if teacher_data else "new"

                    record_id = f"spr_{uuid.uuid4().hex[:12]}"
                    await db.session_payment_records.insert_one({
                        "record_id": record_id,
                        "booking_id": session["booking_id"],
                        "student_id": session["student_id"],
                        "teacher_id": session["teacher_id"],
                        "teacher_tier": teacher_tier,
                        "duration_minutes": duration,
                        "credits_used": booking.get("credits_charged", get_credits_for_duration(duration)),
                        "base_session_price": base_price,
                        "commission_rate": commission_rate,
                        "tutor_payout": tutor_payout,
                        "platform_commission": platform_commission,
                        "created_at": now.isoformat(),
                    })

                    # Credit teacher earnings atomically
                    if teacher_data and teacher_data.get("user_id"):
                        student_user = await db.users.find_one(
                            {"user_id": (await db.students.find_one({"student_id": session["student_id"]}, {"_id": 0, "user_id": 1}) or {}).get("user_id", "")},
                            {"_id": 0, "name": 1}
                        )
                        student_name = student_user.get("name", "Student") if student_user else "Student"

                        from tutor_earnings_routes import credit_tutor_earnings
                        await credit_tutor_earnings(
                            teacher_id=session["teacher_id"],
                            user_id=teacher_data["user_id"],
                            amount=tutor_payout,
                            booking_id=session["booking_id"],
                            session_payment_record_id=record_id,
                            description=f"{student_name} - {duration} min session",
                            gross_amount=base_price,
                            platform_fee=platform_commission,
                            student_id=session["student_id"],
                            duration_minutes=duration,
                        )

                    # Mark payout done on booking (atomic flag)
                    await db.bookings.update_one(
                        {"booking_id": session["booking_id"]},
                        {"$set": {"payment_status": "payout_done"}}
                    )
                    logger.info(f"Revenue credited for session {session_id}")
            except Exception as e:
                logger.error(f"Revenue credit failed for session {session_id}: {e}")
        else:
            await db.bookings.update_one(
                {"booking_id": session["booking_id"]},
                {"$set": {"status": "completed"}}
            )

    return {"progress_id": progress_id, "session_status": "completed"}


@classroom_router.post("/session/{session_id}/rate")
async def rate_teacher(session_id: str, request: Request):
    """Student rates teacher after class."""
    user = await _get_user(request)
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can rate")

    session = await db.class_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    body = await request.json()
    rating = body.get("rating", 5)
    review = body.get("review", "")

    if not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    rating_id = f"rate_{uuid.uuid4().hex[:12]}"
    await db.session_ratings.insert_one({
        "rating_id": rating_id,
        "session_id": session_id,
        "student_id": session["student_id"],
        "teacher_id": session["teacher_id"],
        "rating": rating,
        "review": review,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Update teacher's cumulative average
    new_avg = float(rating)
    teacher = await db.teachers.find_one({"teacher_id": session["teacher_id"]}, {"_id": 0})
    if teacher:
        total_reviews = teacher.get("total_reviews", 0) + 1
        old_avg = teacher.get("average_rating", teacher.get("rating", 5.0))
        new_avg = ((old_avg * (total_reviews - 1)) + rating) / total_reviews
        await db.teachers.update_one(
            {"teacher_id": session["teacher_id"]},
            {"$set": {
                "rating": round(new_avg, 2),
                "average_rating": round(new_avg, 2),
                "total_reviews": total_reviews,
            }}
        )

    return {"rating_id": rating_id, "new_average": round(new_avg, 2)}


# ============== STUDENT PROGRESS HISTORY ==============

@classroom_router.get("/student/{student_id}/progress")
async def get_student_progress(student_id: str, request: Request):
    """Get progress history for a student."""
    user = await _get_user(request)
    if user["role"] == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if not student or student["student_id"] != student_id:
            raise HTTPException(status_code=403, detail="Not authorized")

    records = await db.student_progress.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    return {"progress": records}


# ============== INTERACTIVE ACTIVITIES (Admin CRUD) ==============

@classroom_router.post("/activities")
async def create_activity(data: InteractiveActivityCreate, request: Request):
    """Admin creates an interactive activity. Validates via Pydantic InteractiveActivityCreate model."""
    user = await _get_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    now = datetime.now(timezone.utc)
    activity_id = f"act_{uuid.uuid4().hex[:12]}"

    activity_doc = {
        "activity_id": activity_id,
        "title": data.title,
        "activity_type": data.activity_type,
        "content": data.content,
        "surah_name": data.surah_name,
        "difficulty": data.difficulty,
        "created_by": user["user_id"],
        "is_active": True,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    await db.activities.insert_one(activity_doc)
    return {"activity_id": activity_id}


@classroom_router.get("/activities")
async def list_activities(request: Request, activity_type: Optional[str] = None):
    """List interactive activities."""
    await _get_user(request)
    query = {"is_active": True}
    if activity_type:
        query["activity_type"] = activity_type
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"activities": activities}


@classroom_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, request: Request):
    """Admin deletes/deactivates an activity."""
    user = await _get_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.activities.update_one(
        {"activity_id": activity_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"deleted": True}


# ============== ADMIN: ALL SESSIONS ==============

@classroom_router.get("/admin/sessions")
async def admin_list_sessions(request: Request, status: Optional[str] = None):
    """Admin views all class sessions. When status=live, enforce strict time boundaries with 5-min early access."""
    user = await _get_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    query = {}
    if status:
        query["status"] = status

    sessions = await db.class_sessions.find(query, {"_id": 0}).sort("start_time_utc", -1).to_list(200)

    now = datetime.now(timezone.utc)
    EARLY_ACCESS = timedelta(minutes=5)
    enriched = []
    for s in sessions:
        # Resolve actual end_time from the session doc or the booking
        start_str = s.get("start_time_utc", "")
        end_str = s.get("end_time_utc", "")
        booking_dur = None

        # Look up booking for authoritative duration_minutes
        booking = await db.bookings.find_one({"booking_id": s.get("booking_id")}, {"_id": 0, "duration_minutes": 1})
        if booking:
            booking_dur = booking.get("duration_minutes")

        try:
            start_dt = datetime.fromisoformat(str(start_str).replace("Z", "+00:00"))
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            start_dt = None

        # Compute end_dt from: booking duration > session end_time_utc > fallback 30min
        if start_dt:
            if booking_dur:
                end_dt = start_dt + timedelta(minutes=booking_dur)
            elif end_str:
                try:
                    end_dt = datetime.fromisoformat(str(end_str).replace("Z", "+00:00"))
                    if end_dt.tzinfo is None:
                        end_dt = end_dt.replace(tzinfo=timezone.utc)
                except (ValueError, TypeError):
                    end_dt = start_dt + timedelta(minutes=30)
            else:
                end_dt = start_dt + timedelta(minutes=30)
            duration_mins = int((end_dt - start_dt).total_seconds() / 60)
        else:
            end_dt = None
            duration_mins = booking_dur or 30

        # Strict time enforcement for live sessions
        if status and status.lower() == "live" and start_dt and end_dt:
            if now >= end_dt:
                # Session expired — auto-transition in DB
                report = await db.session_reports.find_one({"booking_id": s.get("booking_id")})
                new_status = "completed" if report else "missed"
                await db.class_sessions.update_one(
                    {"session_id": s["session_id"]},
                    {"$set": {"status": new_status, "updated_at": now.isoformat()}}
                )
                await db.bookings.update_one(
                    {"booking_id": s.get("booking_id")},
                    {"$set": {"status": new_status, "auto_cleaned_at": now.isoformat()}}
                )
                continue  # Do NOT return expired session

        teacher_doc = await db.teachers.find_one({"teacher_id": s["teacher_id"]}, {"_id": 0})
        teacher_user = await db.users.find_one({"user_id": teacher_doc["user_id"]}, {"_id": 0, "name": 1}) if teacher_doc else None
        student_doc = await db.students.find_one({"student_id": s["student_id"]}, {"_id": 0})
        student_user = await db.users.find_one({"user_id": student_doc["user_id"]}, {"_id": 0, "name": 1}) if student_doc else None

        enriched.append({
            **s,
            "teacher_name": teacher_user.get("name") if teacher_user else "Unknown",
            "student_name": student_user.get("name") if student_user else "Unknown",
            "end_time_utc": end_dt.isoformat() if end_dt else "",
            "duration_minutes": duration_mins,
        })

    return {"sessions": enriched}


# ============== ADMIN: SESSION DETAIL WITH RECORDING ==============

@classroom_router.get("/admin/sessions/{session_id}/details")
async def admin_session_details(session_id: str, request: Request):
    """Admin gets full session details including recording URL and progress data."""
    user = await _get_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    session = await db.class_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Enrich with names
    teacher_doc = await db.teachers.find_one({"teacher_id": session["teacher_id"]}, {"_id": 0})
    teacher_user = await db.users.find_one({"user_id": teacher_doc["user_id"]}, {"_id": 0, "name": 1, "email": 1}) if teacher_doc else None
    student_doc = await db.students.find_one({"student_id": session["student_id"]}, {"_id": 0})
    student_user = await db.users.find_one({"user_id": student_doc["user_id"]}, {"_id": 0, "name": 1, "email": 1}) if student_doc else None

    # Get progress data for this session
    progress = await db.student_progress.find_one({"session_id": session_id}, {"_id": 0})

    # Get rating for this session
    rating = await db.session_ratings.find_one({"session_id": session_id}, {"_id": 0})

    # Get payment record
    payment = await db.session_payment_records.find_one({"booking_id": session.get("booking_id")}, {"_id": 0})

    # Recording URL (would be a signed URL in production)
    recording_url = session.get("recording_url")

    return {
        **session,
        "teacher_name": teacher_user.get("name") if teacher_user else "Unknown",
        "teacher_email": teacher_user.get("email") if teacher_user else "",
        "student_name": student_user.get("name") if student_user else "Unknown",
        "student_email": student_user.get("email") if student_user else "",
        "progress": progress,
        "rating": rating,
        "payment": payment,
        "recording_url": recording_url,
    }


# ============== ADMIN: STUDENT REPORT (Aggregated) ==============

@classroom_router.get("/admin/reports/student/{student_id}")
async def admin_student_report(student_id: str, request: Request):
    """Aggregates a student's progress into a clean JSON structure for PDF generation."""
    user = await _get_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # Get student info
    student_doc = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student_doc:
        raise HTTPException(status_code=404, detail="Student not found")
    student_user = await db.users.find_one({"user_id": student_doc["user_id"]}, {"_id": 0, "name": 1, "email": 1})

    # Get all progress records
    progress_records = await db.student_progress.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    # Get all sessions
    sessions = await db.class_sessions.find(
        {"student_id": student_id, "status": "completed"}, {"_id": 0}
    ).sort("start_time_utc", -1).to_list(100)

    # Aggregate scores
    total_sessions = len(sessions)
    avg_fluency = avg_tajweed = avg_makhraj = 0
    if progress_records:
        fluency_scores = [r["grading"].get("fluency_score", 0) for r in progress_records if r.get("grading")]
        tajweed_scores = [r["grading"].get("tajweed_score", 0) for r in progress_records if r.get("grading")]
        makhraj_scores = [r["grading"].get("makhraj_score", 0) for r in progress_records if r.get("grading")]
        avg_fluency = round(sum(fluency_scores) / len(fluency_scores), 1) if fluency_scores else 0
        avg_tajweed = round(sum(tajweed_scores) / len(tajweed_scores), 1) if tajweed_scores else 0
        avg_makhraj = round(sum(makhraj_scores) / len(makhraj_scores), 1) if makhraj_scores else 0

    # Unique surahs covered
    surahs_covered = list(set(r.get("surah_name", "") for r in progress_records if r.get("surah_name")))

    # Track type breakdown
    track_breakdown = {}
    for r in progress_records:
        tt = r.get("track_type", "Unknown")
        track_breakdown[tt] = track_breakdown.get(tt, 0) + 1

    return {
        "student": {
            "student_id": student_id,
            "name": student_user.get("name") if student_user else "Unknown",
            "email": student_user.get("email") if student_user else "",
            "current_level": student_doc.get("current_level", "beginner"),
        },
        "summary": {
            "total_sessions": total_sessions,
            "total_progress_records": len(progress_records),
            "average_scores": {
                "fluency": avg_fluency,
                "tajweed": avg_tajweed,
                "makhraj": avg_makhraj,
            },
            "surahs_covered": surahs_covered,
            "track_type_breakdown": track_breakdown,
        },
        "recent_progress": progress_records[:10],
        "sessions": [{"session_id": s["session_id"], "start_time_utc": s["start_time_utc"], "status": s["status"]} for s in sessions[:20]],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ============== ADMIN: LIVEKIT TOKEN FOR STEALTH JOIN ==============

@classroom_router.post("/admin/stealth-join")
async def admin_stealth_join(request: Request):
    """Admin joins a room in stealth mode (muted, no camera, hidden name)."""
    user = await _get_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    body = await request.json()
    room_name = body.get("room_name")
    if not room_name:
        raise HTTPException(status_code=400, detail="room_name required")

    lk_url = os.environ.get("LIVEKIT_URL")
    lk_key = os.environ.get("LIVEKIT_API_KEY")
    lk_secret = os.environ.get("LIVEKIT_API_SECRET")

    if not all([lk_url, lk_key, lk_secret]):
        raise HTTPException(status_code=500, detail="LiveKit not configured")

    token = livekit_api.AccessToken(api_key=lk_key, api_secret=lk_secret)
    token = token.with_identity(f"admin_{user['user_id']}")
    token = token.with_name("System")
    token = token.with_grants(livekit_api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=False,
        can_subscribe=True,
        can_publish_data=False,
    ))

    jwt_token = token.to_jwt()

    return {
        "token": jwt_token,
        "server_url": lk_url,
        "identity": f"admin_{user['user_id']}",
        "name": "System",
        "is_stealth": True,
    }




# ============== LIVEKIT TOKEN GENERATION ==============

@classroom_router.post("/livekit/token")
async def generate_livekit_token(request: Request):
    """Generate a LiveKit access token for joining a video room."""
    user = await _get_user(request)
    body = await request.json()

    room_name = body.get("room_name")
    if not room_name:
        raise HTTPException(status_code=400, detail="room_name required")

    lk_url = os.environ.get("LIVEKIT_URL")
    lk_key = os.environ.get("LIVEKIT_API_KEY")
    lk_secret = os.environ.get("LIVEKIT_API_SECRET")

    if not all([lk_url, lk_key, lk_secret]):
        raise HTTPException(status_code=500, detail="LiveKit not configured")

    is_teacher = user.get("role") == "teacher"
    identity = user["user_id"]
    name = user.get("name", "Participant")

    token = livekit_api.AccessToken(api_key=lk_key, api_secret=lk_secret)
    token = token.with_identity(identity).with_name(name)
    token = token.with_grants(livekit_api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
    ))

    jwt_token = token.to_jwt()

    return {
        "token": jwt_token,
        "server_url": lk_url,
        "identity": identity,
        "name": name,
        "is_teacher": is_teacher,
    }


# ============== RECORDING TOGGLE ==============

@classroom_router.post("/session/{session_id}/recording/toggle")
async def toggle_recording(session_id: str, request: Request):
    """Start/stop recording. Stealth mode if admin triggers it."""
    user = await _get_user(request)
    role = user.get("role")
    if role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    body = await request.json()
    action = body.get("action", "start")  # "start" or "stop"
    visible = role == "teacher"  # Admin recording is stealth (visible=false)

    session = await db.class_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Broadcast recording event via WS
    room_id = session["meet_link_slug"]
    if room_id in classroom_rooms:
        event = {
            "type": "RECORDING_STARTED" if action == "start" else "RECORDING_STOPPED",
            "visible": visible,
        }
        await broadcast_to_room(room_id, event, exclude=None)

    return {"action": action, "visible": visible, "session_id": session_id}


# ============== WEBSOCKET REAL-TIME SYNC ==============

# Room state: {room_id: {connections, chapter, wordHighlights, recording}}
classroom_rooms = {}


async def broadcast_to_room(room_id, message, exclude=None):
    """Broadcast a JSON message to all connections in a room."""
    if room_id not in classroom_rooms:
        return
    payload = json.dumps(message)
    stale = set()
    for ws in classroom_rooms[room_id]["connections"]:
        if ws == exclude:
            continue
        try:
            await ws.send_text(payload)
        except Exception:
            stale.add(ws)
    classroom_rooms[room_id]["connections"] -= stale


@classroom_router.websocket("/ws/{room_id}")
async def classroom_websocket(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time classroom sync.
    Events: NAVIGATE, HIGHLIGHT_WORD, CLEAR_HIGHLIGHTS, POINTER_MOVE, CHAT, etc.
    """
    await websocket.accept()

    if room_id not in classroom_rooms:
        classroom_rooms[room_id] = {
            "connections": set(),
            "chapter": 1,
            "wordHighlights": {},
            "recording": {"active": False, "visible": False},
            "quranV2": {"chapter": 1, "page": 1, "focusedVerse": None},
        }
    classroom_rooms[room_id]["connections"].add(websocket)

    state = classroom_rooms[room_id]
    await websocket.send_text(json.dumps({
        "type": "ROOM_STATE",
        "chapter": state["chapter"],
        "wordHighlights": state["wordHighlights"],
        "recording": state["recording"],
    }))

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "POINTER_MOVE":
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "NAVIGATE":
                chapter = msg.get("chapter", 1)
                classroom_rooms[room_id]["chapter"] = chapter
                classroom_rooms[room_id]["wordHighlights"] = {}
                await broadcast_to_room(room_id, {
                    "type": "NAVIGATE",
                    "chapter": chapter,
                }, exclude=websocket)

            elif msg_type == "HIGHLIGHT_WORD":
                verse_key = msg.get("verseKey")
                word_pos = msg.get("wordPos")
                action = msg.get("action", "add")
                key = f"{verse_key}:{word_pos}"
                wh = classroom_rooms[room_id]["wordHighlights"]
                if action == "add":
                    wh[key] = True
                else:
                    wh.pop(key, None)
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "CLEAR_HIGHLIGHTS":
                classroom_rooms[room_id]["wordHighlights"] = {}
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "RAISE_HAND":
                await broadcast_to_room(room_id, msg, exclude=None)

            elif msg_type == "LOWER_HAND":
                await broadcast_to_room(room_id, msg, exclude=None)

            elif msg_type == "CHAT":
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "END_CLASS":
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "RECORDING_STARTED":
                classroom_rooms[room_id]["recording"] = {"active": True, "visible": msg.get("visible", True)}
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "RECORDING_STOPPED":
                classroom_rooms[room_id]["recording"] = {"active": False, "visible": False}
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type in ("ACTIVITY_START", "ACTIVITY_CLOSE"):
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "ACTIVITY_ANSWER":
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "SYNC_QURAN_V2":
                # Real-time Quran V2 sync — teacher navigates/hovers/clicks, students mirror
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "SYNC_IQRA":
                # Real-time Iqra sync — teacher changes book/page, students mirror
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "PING":
                await websocket.send_json({"type": "PONG"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WS error in room {room_id}: {e}")
    finally:
        if room_id in classroom_rooms:
            classroom_rooms[room_id]["connections"].discard(websocket)
            if not classroom_rooms[room_id]["connections"]:
                del classroom_rooms[room_id]
