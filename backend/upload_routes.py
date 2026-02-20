"""
Teacher media upload routes.
Handles video intro and certificate uploads with chunked file support.
Currently stores files locally; structured for easy GCS migration.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from datetime import datetime, timezone
from typing import Optional
import uuid
import os
import logging

upload_router = APIRouter(prefix="/api/teacher")
logger = logging.getLogger(__name__)

db = None
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_CERT_SIZE = 10 * 1024 * 1024   # 10MB
ALLOWED_VIDEO_EXT = {".mp4", ".mov", ".webm"}
ALLOWED_CERT_EXT = {".pdf", ".jpg", ".jpeg", ".png"}


def init_upload_routes(database):
    global db
    db = database


async def _get_user_from_request(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user or user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    return user


@upload_router.post("/upload/video-intro")
async def upload_video_intro(request: Request, file: UploadFile = File(...)):
    """Upload a video introduction (max 50MB, .mp4/.mov/.webm)."""
    user = await _get_user_from_request(request)

    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_VIDEO_EXT:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_VIDEO_EXT)}")

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum: {MAX_VIDEO_SIZE // (1024*1024)}MB")

    # Save file
    filename = f"video_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, "videos", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Build public URL
    base_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    if not base_url:
        base_url = str(request.base_url).rstrip("/")
    public_url = f"{base_url}/api/teacher/media/videos/{filename}"

    # Get teacher profile
    teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    # Delete old video if exists
    old_url = teacher.get("video_intro")
    if old_url and "/media/videos/" in old_url:
        old_file = old_url.split("/media/videos/")[-1]
        old_path = os.path.join(UPLOAD_DIR, "videos", old_file)
        if os.path.exists(old_path):
            os.remove(old_path)

    # Save URL to teacher profile
    await db.teachers.update_one(
        {"teacher_id": teacher["teacher_id"]},
        {"$set": {
            "video_intro": public_url,
            "video_intro_updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {
        "success": True,
        "url": public_url,
        "filename": filename,
        "size_bytes": len(contents),
    }


@upload_router.post("/upload/certificate")
async def upload_certificate(request: Request, file: UploadFile = File(...), label: str = Form("Certificate")):
    """Upload a certificate/ijazah (max 10MB, .pdf/.jpg/.png)."""
    user = await _get_user_from_request(request)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_CERT_EXT:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_CERT_EXT)}")

    contents = await file.read()
    if len(contents) > MAX_CERT_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum: {MAX_CERT_SIZE // (1024*1024)}MB")

    filename = f"cert_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, "certificates", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(contents)

    base_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    if not base_url:
        base_url = str(request.base_url).rstrip("/")
    public_url = f"{base_url}/api/teacher/media/certificates/{filename}"

    teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    cert_doc = {
        "cert_id": f"cert_{uuid.uuid4().hex[:8]}",
        "url": public_url,
        "label": label,
        "original_filename": file.filename,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.teachers.update_one(
        {"teacher_id": teacher["teacher_id"]},
        {"$push": {"certificates": cert_doc}}
    )

    return {
        "success": True,
        "certificate": cert_doc,
    }


@upload_router.delete("/certificate/{cert_id}")
async def delete_certificate(cert_id: str, request: Request):
    """Delete a certificate from teacher profile."""
    user = await _get_user_from_request(request)
    teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    certs = teacher.get("certificates", [])
    cert = next((c for c in certs if c["cert_id"] == cert_id), None)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Delete file
    if "/media/certificates/" in cert.get("url", ""):
        fname = cert["url"].split("/media/certificates/")[-1]
        fpath = os.path.join(UPLOAD_DIR, "certificates", fname)
        if os.path.exists(fpath):
            os.remove(fpath)

    await db.teachers.update_one(
        {"teacher_id": teacher["teacher_id"]},
        {"$pull": {"certificates": {"cert_id": cert_id}}}
    )

    return {"success": True}


# Static file serving for uploads
@upload_router.get("/media/videos/{filename}")
async def serve_video(filename: str):
    filepath = os.path.join(UPLOAD_DIR, "videos", filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath, media_type="video/mp4")


@upload_router.get("/media/certificates/{filename}")
async def serve_certificate(filename: str):
    filepath = os.path.join(UPLOAD_DIR, "certificates", filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    ext = os.path.splitext(filename)[1].lower()
    media_type = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }.get(ext, "application/octet-stream")
    return FileResponse(filepath, media_type=media_type)
