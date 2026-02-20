"""
Quran.com V4 API Proxy with MongoDB Caching
Proxies verse data with word-level breakdown for the Interactive Mushaf.
"""
from fastapi import APIRouter, HTTPException
import httpx
import logging

logger = logging.getLogger(__name__)

quran_router = APIRouter(prefix="/api/quran")
db = None

QURAN_API_BASE = "https://api.quran.com/api/v4"

def init_quran_routes(database):
    global db
    db = database


@quran_router.get("/verses/{chapter_id}")
async def get_chapter_verses(chapter_id: int, page: int = 1, per_page: int = 50):
    """Fetch verses with word-level data, cached in MongoDB."""
    if chapter_id < 1 or chapter_id > 114:
        raise HTTPException(status_code=400, detail="Invalid chapter ID (1-114)")

    cache_key = f"quran_v4_ch{chapter_id}_p{page}_pp{per_page}"
    cached = await db.quran_cache.find_one({"cache_key": cache_key}, {"_id": 0})
    if cached:
        return cached["data"]

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = f"{QURAN_API_BASE}/verses/by_chapter/{chapter_id}"
            params = {
                "words": "true",
                "word_fields": "text_uthmani,text",
                "per_page": str(per_page),
                "page": str(page),
            }
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Quran API HTTP error: {e.response.status_code}")
        raise HTTPException(status_code=502, detail="Quran API temporarily unavailable")
    except Exception as e:
        logger.error(f"Quran API error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch Quran data")

    # Cache the response
    await db.quran_cache.update_one(
        {"cache_key": cache_key},
        {"$set": {"cache_key": cache_key, "data": data}},
        upsert=True
    )
    return data


@quran_router.get("/chapters")
async def get_chapters():
    """Fetch list of all 114 surahs with metadata, cached."""
    cached = await db.quran_cache.find_one({"cache_key": "chapters_list"}, {"_id": 0})
    if cached:
        return cached["data"]

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(f"{QURAN_API_BASE}/chapters")
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.error(f"Quran chapters API error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch chapters")

    await db.quran_cache.update_one(
        {"cache_key": "chapters_list"},
        {"$set": {"cache_key": "chapters_list", "data": data}},
        upsert=True
    )
    return data
