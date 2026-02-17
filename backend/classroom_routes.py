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

    return {
        **session,
        "teacher_name": teacher_user.get("name") if teacher_user else "Unknown",
        "teacher_picture": teacher_user.get("picture") if teacher_user else None,
        "student_name": student_user.get("name") if student_user else "Unknown",
        "student_picture": student_user.get("picture") if student_user else None,
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
        await db.bookings.update_one(
            {"booking_id": session["booking_id"]},
            {"$set": {"status": "completed"}}
        )

        # REVENUE TRIGGER: Credit teacher earnings
        try:
            booking = await db.bookings.find_one({"booking_id": session["booking_id"]}, {"_id": 0})
            if booking:
                from wallet_routes import deduct_credits, DeductCreditsRequest
                student_doc = await db.students.find_one({"student_id": session["student_id"]}, {"_id": 0})
                if student_doc:
                    deduct_req = DeductCreditsRequest(
                        booking_id=session["booking_id"],
                        teacher_id=session["teacher_id"],
                        duration_minutes=booking.get("duration_minutes", 30),
                    )
                    await deduct_credits(deduct_req, student_doc["user_id"])
                    logger.info(f"Revenue credited for session {session_id}")
        except Exception as e:
            # Log but don't fail the progress submission
            logger.error(f"Revenue credit failed for session {session_id}: {e}")

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
    """Admin views all class sessions."""
    user = await _get_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    query = {}
    if status:
        query["status"] = status

    sessions = await db.class_sessions.find(query, {"_id": 0}).sort("start_time_utc", -1).to_list(200)

    enriched = []
    for s in sessions:
        teacher_doc = await db.teachers.find_one({"teacher_id": s["teacher_id"]}, {"_id": 0})
        teacher_user = await db.users.find_one({"user_id": teacher_doc["user_id"]}, {"_id": 0, "name": 1}) if teacher_doc else None
        student_doc = await db.students.find_one({"student_id": s["student_id"]}, {"_id": 0})
        student_user = await db.users.find_one({"user_id": student_doc["user_id"]}, {"_id": 0, "name": 1}) if student_doc else None
        enriched.append({
            **s,
            "teacher_name": teacher_user.get("name") if teacher_user else "Unknown",
            "student_name": student_user.get("name") if student_user else "Unknown",
        })

    return {"sessions": enriched}



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

# Room state: {room_id: {connections: set(), page: int, highlights: [], recording: {}}}
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
    Events: POINTER_MOVE, PAGE_CHANGE, HIGHLIGHT, RECORDING_STARTED/STOPPED
    """
    await websocket.accept()

    # Register connection
    if room_id not in classroom_rooms:
        classroom_rooms[room_id] = {
            "connections": set(),
            "page": 1,
            "highlights": [],
            "recording": {"active": False, "visible": False},
        }
    classroom_rooms[room_id]["connections"].add(websocket)

    # Send current room state on join
    state = classroom_rooms[room_id]
    await websocket.send_text(json.dumps({
        "type": "ROOM_STATE",
        "page": state["page"],
        "highlights": state["highlights"],
        "recording": state["recording"],
    }))

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "POINTER_MOVE":
                # Broadcast pointer coords to everyone except sender
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "PAGE_CHANGE":
                # Teacher changes page — sync all
                classroom_rooms[room_id]["page"] = msg.get("page", 1)
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "HIGHLIGHT":
                # Add/remove highlight and broadcast
                hl = {"verseKey": msg.get("verseKey"), "color": msg.get("color")}
                highlights = classroom_rooms[room_id]["highlights"]
                existing = next((i for i, h in enumerate(highlights) if h["verseKey"] == hl["verseKey"]), None)
                if existing is not None:
                    highlights.pop(existing)
                else:
                    highlights.append(hl)
                await broadcast_to_room(room_id, {
                    "type": "HIGHLIGHT_SYNC",
                    "highlights": highlights,
                }, exclude=None)

            elif msg_type == "NAVIGATE":
                # Surah/Juz navigation — resolves to page
                classroom_rooms[room_id]["page"] = msg.get("page", 1)
                await broadcast_to_room(room_id, {
                    "type": "PAGE_CHANGE",
                    "page": msg.get("page", 1),
                }, exclude=websocket)

            elif msg_type == "RAISE_HAND":
                # Student raises/lowers hand — broadcast to all
                await broadcast_to_room(room_id, msg, exclude=None)

            elif msg_type == "LOWER_HAND":
                # Teacher or student lowers hand — broadcast to all
                await broadcast_to_room(room_id, msg, exclude=None)

            elif msg_type == "CHAT":
                # Chat message — broadcast to all except sender
                await broadcast_to_room(room_id, msg, exclude=websocket)

            elif msg_type == "END_CLASS":
                # Teacher ended class — notify student
                await broadcast_to_room(room_id, msg, exclude=websocket)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WS error in room {room_id}: {e}")
    finally:
        if room_id in classroom_rooms:
            classroom_rooms[room_id]["connections"].discard(websocket)
            if not classroom_rooms[room_id]["connections"]:
                del classroom_rooms[room_id]
