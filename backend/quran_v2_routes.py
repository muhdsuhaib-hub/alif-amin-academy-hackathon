"""
Quran V2 — Secure Content Bridge
OAuth2 Client Credentials flow with api.quran.com/api/v4.
All frontend calls are proxied through here; credentials never leave the server.
"""
from fastapi import APIRouter, HTTPException, Request
import httpx
import os
import time
import logging

logger = logging.getLogger(__name__)

quran_v2_router = APIRouter(prefix="/api/quran/v2")
db = None

# --------------- OAuth2 Token Cache ---------------
_token_cache = {"access_token": None, "expires_at": 0}


QURAN_PUBLIC_API = "https://api.quran.com/api/v4"


def _has_oauth_config():
    return all([
        os.environ.get("QURAN_CLIENT_ID"),
        os.environ.get("QURAN_CLIENT_SECRET"),
        os.environ.get("QURAN_OAUTH_URL"),
        os.environ.get("QURAN_API_URL"),
    ])


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
            data={"grant_type": "client_credentials"},
            auth=(cid, secret),
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
    """Make a GET request to the Quran API. Uses OAuth if configured, public API otherwise."""
    if not _has_oauth_config():
        # Fallback to public Quran.com API (no auth required)
        url = f"{QURAN_PUBLIC_API}{path}"
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            return r.json()

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
            _token_cache["access_token"] = None
            token = await _get_access_token()
            r = await client.get(url, params=params, headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        return r.json()


def init_quran_v2_routes(database):
    global db
    db = database


# --------------- OAuth2 Authorization Code + PKCE (User-Level) ---------------

OAUTH2_BASE = os.environ.get("QURAN_OAUTH_URL", "https://oauth2.quran.foundation")
QF_API_BASE = os.environ.get("QURAN_USER_API_URL", "https://apis.quran.foundation")


def _generate_pkce():
    """Generate PKCE code_verifier and code_challenge (S256)."""
    import hashlib
    import base64
    import secrets as sec
    verifier = base64.urlsafe_b64encode(sec.token_bytes(32)).rstrip(b"=").decode()
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


@quran_v2_router.get("/oauth/login")
async def quran_oauth_login(request: Request):
    """Redirect user to Quran Foundation authorization page."""
    import secrets as sec
    cid = os.environ.get("QURAN_CLIENT_ID")
    redirect_uri = os.environ.get("QURAN_REDIRECT_URI", str(request.base_url).rstrip("/") + "/api/quran/v2/oauth/callback")
    if not cid:
        raise HTTPException(status_code=500, detail="QURAN_CLIENT_ID not configured")

    state = sec.token_urlsafe(32)
    nonce = sec.token_urlsafe(16)
    verifier, challenge = _generate_pkce()

    # Extract user_id from session
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

    # Store PKCE verifier + state in DB, keyed by state for callback lookup
    await db.quran_oauth_state.insert_one({
        "state": state,
        "nonce": nonce,
        "code_verifier": verifier,
        "user_id": session["user_id"],
        "redirect_uri": redirect_uri,
        "created_at": time.time(),
    })

    from urllib.parse import urlencode
    params = urlencode({
        "client_id": cid,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid",
        "state": state,
        "nonce": nonce,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    })
    auth_url = f"{OAUTH2_BASE}/oauth2/auth?{params}"
    from starlette.responses import RedirectResponse
    return RedirectResponse(url=auth_url)


@quran_v2_router.get("/oauth/callback")
async def quran_oauth_callback(request: Request):
    """Handle Quran Foundation OAuth2 callback — exchange code for tokens."""
    params = dict(request.query_params)
    code = params.get("code", "")
    state = params.get("state", "")
    error = params.get("error", "")

    if error:
        logger.error(f"[QF OAuth] Error from provider: {error} - {params.get('error_description', '')}")
        from starlette.responses import RedirectResponse
        return RedirectResponse(url="/student/dashboard?qf_auth=error")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    # Look up the PKCE state
    stored = await db.quran_oauth_state.find_one({"state": state})
    if not stored:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    # Clean up used state
    await db.quran_oauth_state.delete_one({"state": state})

    cid = os.environ.get("QURAN_CLIENT_ID")
    csecret = os.environ.get("QURAN_CLIENT_SECRET")
    redirect_uri = stored["redirect_uri"]
    verifier = stored["code_verifier"]
    user_id = stored["user_id"]

    # Exchange code for tokens
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            token_url = f"{OAUTH2_BASE}/oauth2/token"
            payload = {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "code_verifier": verifier,
            }
            auth_header = None
            if csecret:
                auth_header = (cid, csecret)
            else:
                payload["client_id"] = cid

            r = await client.post(token_url, data=payload, auth=auth_header)
            if r.status_code != 200:
                logger.error(f"[QF OAuth] Token exchange failed {r.status_code}: {r.text}")
                from starlette.responses import RedirectResponse
                return RedirectResponse(url="/student/dashboard?qf_auth=failed")

            tokens = r.json()
    except Exception as e:
        logger.error(f"[QF OAuth] Token exchange error: {e}")
        from starlette.responses import RedirectResponse
        return RedirectResponse(url="/student/dashboard?qf_auth=error")

    # Save tokens to user document
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "quran_com_auth": {
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "id_token": tokens.get("id_token"),
                "expires_at": time.time() + tokens.get("expires_in", 3600),
                "token_type": tokens.get("token_type", "bearer"),
                "connected_at": time.time(),
            }
        }}
    )
    logger.info(f"[QF OAuth] User {user_id} connected Quran.com account")

    # Redirect back to dashboard with success flag
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "role": 1})
    dashboard = "/teacher/dashboard" if user and user.get("role") == "teacher" else "/student/dashboard"
    from starlette.responses import RedirectResponse
    return RedirectResponse(url=f"{dashboard}?qf_auth=success")


@quran_v2_router.get("/oauth/status")
async def quran_oauth_status(request: Request):
    """Check if the current user has connected their Quran.com account."""
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
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "quran_com_auth": 1})
    qf_auth = user.get("quran_com_auth") if user else None
    connected = bool(qf_auth and qf_auth.get("access_token"))
    return {"connected": connected, "connected_at": qf_auth.get("connected_at") if qf_auth else None}


# --------------- Content Endpoints ---------------

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
