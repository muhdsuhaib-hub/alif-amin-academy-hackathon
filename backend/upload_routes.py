"""
Teacher media upload routes.
Handles video intro and certificate uploads with chunked file support.
Uses GCS when configured, falls back to local storage.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from datetime import datetime, timezone
from typing import Optional
import uuid
import os
import logging
import json

upload_router = APIRouter(prefix="/api/teacher")
logger = logging.getLogger(__name__)

db = None
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_CERT_SIZE = 10 * 1024 * 1024   # 10MB
ALLOWED_VIDEO_EXT = {".mp4", ".mov", ".webm"}
ALLOWED_CERT_EXT = {".pdf", ".jpg", ".jpeg", ".png"}

# GCS client (lazy-initialized)
_gcs_client = None
_gcs_bucket = None


def init_upload_routes(database):
    global db
    db = database


def _get_gcs_bucket():
    """Lazy-init GCS bucket. Returns None if GCS is not configured."""
    global _gcs_client, _gcs_bucket
    if _gcs_bucket is not None:
        return _gcs_bucket

    bucket_name = os.environ.get("GCS_BUCKET_NAME", "")
    creds_json = os.environ.get("GCS_CREDENTIALS_JSON", "")

    if not bucket_name:
        return None

    try:
        from google.cloud import storage as gcs_storage
        if creds_json:
            # Parse JSON credentials string
            creds_path = "/tmp/gcs_creds.json"
            with open(creds_path, "w") as f:
                f.write(creds_json)
            _gcs_client = gcs_storage.Client.from_service_account_json(creds_path)
        else:
            # Try default credentials (e.g., GKE workload identity)
            _gcs_client = gcs_storage.Client()

        _gcs_bucket = _gcs_client.bucket(bucket_name)
        logger.info(f"GCS initialized: bucket={bucket_name}")
        return _gcs_bucket
    except Exception as e:
        logger.warning(f"GCS init failed (falling back to local): {e}")
        return None


async def _upload_to_gcs(contents: bytes, filename: str, content_type: str) -> Optional[str]:
    """Upload file to GCS. Returns public URL or None on failure."""
    bucket = _get_gcs_bucket()
    if not bucket:
        return None
    try:
        blob = bucket.blob(filename)
        blob.upload_from_string(contents, content_type=content_type)
        blob.make_public()
        logger.info(f"GCS upload success: {blob.public_url}")
        return blob.public_url
    except Exception as e:
        logger.warning(f"GCS upload failed (falling back to local): {e}")
        return None


def _save_local(contents: bytes, subdir: str, filename: str) -> str:
    """Save file locally and return the local media path."""
    filepath = os.path.join(UPLOAD_DIR, subdir, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(contents)
    return filepath


def _build_local_url(request: Request, subdir: str, filename: str) -> str:
    base_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    if not base_url:
        base_url = str(request.base_url).rstrip("/")
    return f"{base_url}/api/teacher/media/{subdir}/{filename}"


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

    # Try GCS first, fall back to local
    filename = f"video_{uuid.uuid4().hex[:12]}{ext}"
    content_type = {"mp4": "video/mp4", "mov": "video/quicktime", "webm": "video/webm"}.get(ext.lstrip("."), "video/mp4")
    public_url = await _upload_to_gcs(contents, f"videos/{filename}", content_type)
    if not public_url:
        _save_local(contents, "videos", filename)
        public_url = _build_local_url(request, "videos", filename)

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
    content_type = {".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}.get(ext, "application/octet-stream")
    public_url = await _upload_to_gcs(contents, f"certificates/{filename}", content_type)
    if not public_url:
        _save_local(contents, "certificates", filename)
        public_url = _build_local_url(request, "certificates", filename)

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
