"""
Quran Ayah Bookmarks — User API for the Quran Foundation Hackathon.
Allows authenticated users to bookmark, unbookmark, and list their saved ayahs.
Stored in MongoDB `bookmarks` collection, keyed by user_id + verse_key.
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
import logging

bookmark_router = APIRouter(prefix="/api/bookmarks")
logger = logging.getLogger(__name__)

db = None


def init_bookmark_routes(database):
    global db
    db = database


async def _get_user(request: Request):
    """Extract authenticated user from session cookie/header."""
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
    return session["user_id"]


@bookmark_router.get("")
async def list_bookmarks(request: Request):
    """List all bookmarks for the current user, newest first."""
    user_id = await _get_user(request)
    bookmarks = await db.bookmarks.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return {"bookmarks": bookmarks}


@bookmark_router.post("")
async def add_bookmark(request: Request):
    """Bookmark an ayah. Body: { verse_key, chapter_id, verse_number, surah_name }"""
    user_id = await _get_user(request)
    body = await request.json()
    verse_key = body.get("verse_key", "").strip()
    if not verse_key or ":" not in verse_key:
        raise HTTPException(status_code=400, detail="verse_key required (e.g. '2:255')")

    existing = await db.bookmarks.find_one(
        {"user_id": user_id, "verse_key": verse_key}, {"_id": 0}
    )
    if existing:
        return {"success": True, "action": "already_exists", "bookmark": existing}

    bookmark = {
        "user_id": user_id,
        "verse_key": verse_key,
        "chapter_id": body.get("chapter_id"),
        "verse_number": body.get("verse_number"),
        "surah_name": body.get("surah_name", ""),
        "note": body.get("note", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookmarks.insert_one(bookmark)
    bookmark.pop("_id", None)
    logger.info(f"[Bookmark] User {user_id} bookmarked {verse_key}")
    return {"success": True, "action": "created", "bookmark": bookmark}


@bookmark_router.delete("/{verse_key:path}")
async def remove_bookmark(verse_key: str, request: Request):
    """Remove a bookmark by verse_key (e.g. '2:255')."""
    user_id = await _get_user(request)
    result = await db.bookmarks.delete_one({"user_id": user_id, "verse_key": verse_key})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    logger.info(f"[Bookmark] User {user_id} removed bookmark {verse_key}")
    return {"success": True, "verse_key": verse_key}
