"""
Quran V2 — Secure Content Bridge
OAuth2 Client Credentials flow with api.quran.com/api/v4.
All frontend calls are proxied through here; credentials never leave the server.
"""
from fastapi import APIRouter, HTTPException
import httpx
import os
import time
import logging

logger = logging.getLogger(__name__)

quran_v2_router = APIRouter(prefix="/api/quran/v2")
db = None

# --------------- OAuth2 Token Cache ---------------
_token_cache = {"access_token": None, "expires_at": 0}


def _get_config():
    cid = os.environ.get("QURAN_CLIENT_ID")
    secret = os.environ.get("QURAN_CLIENT_SECRET")
    oauth_url = os.environ.get("QURAN_OAUTH_URL")
    api_url = os.environ.get("QURAN_API_URL")
    if not all([cid, secret, oauth_url, api_url]):
        raise HTTPException(status_code=500, detail="Quran API credentials not configured")
    return cid, secret, oauth_url, api_url


async def _get_access_token() -> str:
    """Return a valid access token, refreshing if expired."""
    global _token_cache
    if _token_cache["access_token"] and time.time() < _token_cache["expires_at"] - 60:
        return _token_cache["access_token"]

    cid, secret, oauth_url, _ = _get_config()
    token_url = f"{oauth_url}/oauth2/token"

    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": cid,
                "client_secret": secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if r.status_code != 200:
            logger.error(f"OAuth2 token error {r.status_code}: {r.text}")
            raise HTTPException(status_code=502, detail="Failed to authenticate with Quran API")

        body = r.json()
        _token_cache["access_token"] = body["access_token"]
        _token_cache["expires_at"] = time.time() + body.get("expires_in", 3600)
        logger.info("Quran V2 OAuth2 token refreshed")
        return _token_cache["access_token"]


async def _authed_get(path: str, params: dict | None = None) -> dict:
    """Make an authenticated GET request to the Quran API."""
    _, _, _, api_url = _get_config()
    token = await _get_access_token()
    url = f"{api_url}{path}"

    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(
            url,
            params=params,
            headers={"Authorization": f"Bearer {token}"},
        )
        if r.status_code == 401:
            # Token expired mid-flight, force refresh
            _token_cache["access_token"] = None
            token = await _get_access_token()
            r = await client.get(url, params=params, headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        return r.json()


def init_quran_v2_routes(database):
    global db
    db = database


# --------------- Endpoints ---------------

@quran_v2_router.get("/chapters")
async def get_chapters():
    """List all 114 surahs with metadata."""
    cache_key = "v2_chapters"
    cached = await db.quran_cache.find_one({"cache_key": cache_key}, {"_id": 0})
    if cached:
        return cached["data"]

    try:
        data = await _authed_get("/chapters", {"language": "en"})
    except httpx.HTTPStatusError as e:
        logger.error(f"Quran V2 chapters error: {e}")
        raise HTTPException(status_code=502, detail="Quran API temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quran V2 chapters error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch chapters")

    await db.quran_cache.update_one(
        {"cache_key": cache_key},
        {"$set": {"cache_key": cache_key, "data": data}},
        upsert=True,
    )
    return data


@quran_v2_router.get("/verses/by_chapter/{chapter_id}")
async def get_verses_by_chapter(chapter_id: int, page: int = 1, per_page: int = 50):
    """Fetch word-by-word verses for a chapter."""
    if chapter_id < 1 or chapter_id > 114:
        raise HTTPException(status_code=400, detail="Invalid chapter ID (1-114)")

    cache_key = f"v2_ch{chapter_id}_p{page}_pp{per_page}"
    cached = await db.quran_cache.find_one({"cache_key": cache_key}, {"_id": 0})
    if cached:
        return cached["data"]

    try:
        data = await _authed_get(
            f"/verses/by_chapter/{chapter_id}",
            {
                "words": "true",
                "word_fields": "text_uthmani,text,text_indopak",
                "fields": "text_uthmani,verse_key,chapter_id,verse_number,page_number,juz_number",
                "per_page": str(per_page),
                "page": str(page),
                "language": "en",
            },
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"Quran V2 verses error {e.response.status_code}")
        raise HTTPException(status_code=502, detail="Quran API temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quran V2 verses error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch verses")

    await db.quran_cache.update_one(
        {"cache_key": cache_key},
        {"$set": {"cache_key": cache_key, "data": data}},
        upsert=True,
    )
    return data


@quran_v2_router.get("/verses/by_page/{page_number}")
async def get_verses_by_page(page_number: int, per_page: int = 50):
    """Fetch word-by-word verses for a Mushaf page (1-604)."""
    if page_number < 1 or page_number > 604:
        raise HTTPException(status_code=400, detail="Invalid page number (1-604)")

    cache_key = f"v2_page{page_number}_pp{per_page}"
    cached = await db.quran_cache.find_one({"cache_key": cache_key}, {"_id": 0})
    if cached:
        return cached["data"]

    try:
        data = await _authed_get(
            f"/verses/by_page/{page_number}",
            {
                "words": "true",
                "word_fields": "text_uthmani,text,text_indopak",
                "fields": "text_uthmani,verse_key,chapter_id,verse_number,page_number,juz_number",
                "per_page": str(per_page),
                "language": "en",
            },
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"Quran V2 page error {e.response.status_code}")
        raise HTTPException(status_code=502, detail="Quran API temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quran V2 page error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch page data")

    await db.quran_cache.update_one(
        {"cache_key": cache_key},
        {"$set": {"cache_key": cache_key, "data": data}},
        upsert=True,
    )
    return data


@quran_v2_router.get("/juzs")
async def get_juzs():
    """List all 30 Juz."""
    cache_key = "v2_juzs"
    cached = await db.quran_cache.find_one({"cache_key": cache_key}, {"_id": 0})
    if cached:
        return cached["data"]

    try:
        data = await _authed_get("/juzs")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quran V2 juzs error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch juz data")

    await db.quran_cache.update_one(
        {"cache_key": cache_key},
        {"$set": {"cache_key": cache_key, "data": data}},
        upsert=True,
    )
    return data
