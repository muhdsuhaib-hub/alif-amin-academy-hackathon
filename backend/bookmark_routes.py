"""
Quran Ayah Bookmarks — Proxied to Quran Foundation User API.
All bookmark CRUD goes to the official Quran.com API using the user's OAuth2 access token.
Local MongoDB is NOT used for bookmark storage.
"""
from fastapi import APIRouter, HTTPException, Request
import httpx
import os
import time
import logging

bookmark_router = APIRouter(prefix="/api/bookmarks")
logger = logging.getLogger(__name__)

db = None

QF_API_BASE = os.environ.get("QURAN_USER_API_URL", "https://apis.quran.foundation")


def init_bookmark_routes(database):
    global db
    db = database


async def _get_user_id(request: Request) -> str:
    """Extract authenticated user_id from session."""
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


async def _get_qf_token(user_id: str) -> str:
    """Get the user's Quran Foundation access token. Refresh if expired."""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "quran_com_auth": 1})
    qf = user.get("quran_com_auth") if user else None
    if not qf or not qf.get("access_token"):
        raise HTTPException(
            status_code=401,
            detail="QURAN_COM_NOT_CONNECTED"
        )

    # Check if token is expired, attempt refresh
    if qf.get("expires_at", 0) < time.time() and qf.get("refresh_token"):
        try:
            oauth_base = os.environ.get("QURAN_OAUTH_URL", "https://oauth2.quran.foundation")
            cid = os.environ.get("QURAN_CLIENT_ID")
            csecret = os.environ.get("QURAN_CLIENT_SECRET")
            async with httpx.AsyncClient(timeout=15.0) as client:
                payload = {
                    "grant_type": "refresh_token",
                    "refresh_token": qf["refresh_token"],
                }
                auth_header = (cid, csecret) if csecret else None
                if not csecret:
                    payload["client_id"] = cid
                r = await client.post(f"{oauth_base}/oauth2/token", data=payload, auth=auth_header)
                if r.status_code == 200:
                    tokens = r.json()
                    new_auth = {
                        "access_token": tokens.get("access_token"),
                        "refresh_token": tokens.get("refresh_token", qf["refresh_token"]),
                        "id_token": tokens.get("id_token", qf.get("id_token")),
                        "expires_at": time.time() + tokens.get("expires_in", 3600),
                        "token_type": tokens.get("token_type", "bearer"),
                        "connected_at": qf.get("connected_at"),
                    }
                    await db.users.update_one(
                        {"user_id": user_id},
                        {"$set": {"quran_com_auth": new_auth}}
                    )
                    logger.info(f"[Bookmark] Refreshed QF token for user {user_id}")
                    return new_auth["access_token"]
                else:
                    logger.warning(f"[Bookmark] Token refresh failed {r.status_code}: {r.text}")
                    # Clear stale auth so user re-connects
                    await db.users.update_one(
                        {"user_id": user_id},
                        {"$unset": {"quran_com_auth": ""}}
                    )
                    raise HTTPException(status_code=401, detail="QURAN_COM_NOT_CONNECTED")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[Bookmark] Token refresh error: {e}")
            raise HTTPException(status_code=401, detail="QURAN_COM_NOT_CONNECTED")

    return qf["access_token"]


def _qf_headers(access_token: str) -> dict:
    """Build headers for Quran Foundation User API calls."""
    return {
        "x-auth-token": access_token,
        "x-client-id": os.environ.get("QURAN_CLIENT_ID", ""),
        "Content-Type": "application/json",
    }


@bookmark_router.get("")
async def list_bookmarks(request: Request):
    """List all bookmarks from the official Quran Foundation API."""
    user_id = await _get_user_id(request)
    access_token = await _get_qf_token(user_id)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                f"{QF_API_BASE}/v1/bookmarks",
                headers=_qf_headers(access_token),
            )
            if r.status_code == 401:
                await db.users.update_one({"user_id": user_id}, {"$unset": {"quran_com_auth": ""}})
                raise HTTPException(status_code=401, detail="QURAN_COM_NOT_CONNECTED")
            r.raise_for_status()
            data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Bookmark] QF GET bookmarks error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch bookmarks from Quran.com")

    # Map QF response to our frontend format
    raw_bookmarks = data.get("data", data.get("bookmarks", []))
    if isinstance(raw_bookmarks, dict):
        raw_bookmarks = raw_bookmarks.get("items", [])
    bookmarks = []
    for b in raw_bookmarks:
        bookmarks.append({
            "id": b.get("id"),
            "verse_key": f"{b.get('key', b.get('surah', ''))}"
                         f":{b.get('verseNumber', b.get('ayah', ''))}",
            "chapter_id": b.get("key", b.get("surah")),
            "verse_number": b.get("verseNumber", b.get("ayah")),
            "type": b.get("type", "ayah"),
            "created_at": b.get("createdAt", b.get("created_at", "")),
        })

    return {"bookmarks": bookmarks}


@bookmark_router.post("")
async def add_bookmark(request: Request):
    """Add a bookmark via the official Quran Foundation API."""
    user_id = await _get_user_id(request)
    access_token = await _get_qf_token(user_id)
    body = await request.json()

    verse_key = body.get("verse_key", "").strip()
    if not verse_key or ":" not in verse_key:
        raise HTTPException(status_code=400, detail="verse_key required (e.g. '2:255')")

    parts = verse_key.split(":")
    chapter_id = body.get("chapter_id") or int(parts[0])
    verse_number = body.get("verse_number") or int(parts[1])

    # Map to Quran Foundation schema
    qf_payload = {
        "key": chapter_id,
        "type": "ayah",
        "verseNumber": verse_number,
        "isReading": False,
        "mushafId": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{QF_API_BASE}/v1/bookmarks",
                headers=_qf_headers(access_token),
                json=qf_payload,
            )
            if r.status_code == 401:
                await db.users.update_one({"user_id": user_id}, {"$unset": {"quran_com_auth": ""}})
                raise HTTPException(status_code=401, detail="QURAN_COM_NOT_CONNECTED")
            r.raise_for_status()
            data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Bookmark] QF POST bookmark error: {e}")
        raise HTTPException(status_code=502, detail="Failed to save bookmark to Quran.com")

    logger.info(f"[Bookmark] User {user_id} bookmarked {verse_key} via QF API")
    return {
        "success": True,
        "action": "created",
        "bookmark": {
            "id": data.get("id", data.get("data", {}).get("id")),
            "verse_key": verse_key,
            "chapter_id": chapter_id,
            "verse_number": verse_number,
        },
    }


@bookmark_router.delete("/{verse_key:path}")
async def remove_bookmark(verse_key: str, request: Request):
    """Remove a bookmark via the official Quran Foundation API."""
    user_id = await _get_user_id(request)
    access_token = await _get_qf_token(user_id)

    # First, fetch bookmarks to find the QF bookmark ID for this verse_key
    parts = verse_key.split(":")
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid verse_key format")
    target_chapter = int(parts[0])
    target_verse = int(parts[1])

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get all bookmarks to find the matching ID
            r = await client.get(
                f"{QF_API_BASE}/v1/bookmarks",
                headers=_qf_headers(access_token),
            )
            if r.status_code == 401:
                await db.users.update_one({"user_id": user_id}, {"$unset": {"quran_com_auth": ""}})
                raise HTTPException(status_code=401, detail="QURAN_COM_NOT_CONNECTED")
            r.raise_for_status()
            data = r.json()

            raw = data.get("data", data.get("bookmarks", []))
            if isinstance(raw, dict):
                raw = raw.get("items", [])

            bookmark_id = None
            for b in raw:
                if b.get("key") == target_chapter and b.get("verseNumber") == target_verse:
                    bookmark_id = b.get("id")
                    break

            if not bookmark_id:
                raise HTTPException(status_code=404, detail="Bookmark not found on Quran.com")

            # Delete by ID
            dr = await client.delete(
                f"{QF_API_BASE}/v1/bookmarks/{bookmark_id}",
                headers=_qf_headers(access_token),
            )
            if dr.status_code == 401:
                await db.users.update_one({"user_id": user_id}, {"$unset": {"quran_com_auth": ""}})
                raise HTTPException(status_code=401, detail="QURAN_COM_NOT_CONNECTED")
            dr.raise_for_status()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Bookmark] QF DELETE bookmark error: {e}")
        raise HTTPException(status_code=502, detail="Failed to remove bookmark from Quran.com")

    logger.info(f"[Bookmark] User {user_id} removed bookmark {verse_key} via QF API")
    return {"success": True, "verse_key": verse_key}
