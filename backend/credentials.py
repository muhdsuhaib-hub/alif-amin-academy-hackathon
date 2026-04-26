"""
Dynamic credential resolver for Alif Amin Academy.
Fetches from MongoDB admin_settings (encrypted) first, falls back to .env.
"""
import os
import base64
import hashlib
import logging
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

db = None


def init_credentials(database):
    global db
    db = database


def _get_fernet_key():
    secret = os.environ.get("ADMIN_ENCRYPT_SECRET", "alif-amin-default-secret-key-2026")
    key = hashlib.sha256(secret.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def _decrypt(encrypted: str) -> str:
    try:
        return _get_fernet_key().decrypt(encrypted.encode()).decode()
    except Exception:
        return ""


async def get_credential(key: str, env_key: str = "", default: str = "") -> str:
    """
    Resolve a credential: DB admin_settings first, then .env, then default.
    `key` = field name in admin_settings (e.g. 'billplz_api_key')
    `env_key` = corresponding env var (e.g. 'BILLPLZ_API_KEY')
    """
    # 1. Try database
    if db is not None:
        try:
            settings = await db.admin_settings.find_one({"_id_key": "global"}, {"_id": 0})
            if settings:
                encrypted = settings.get(key, "")
                if encrypted:
                    val = _decrypt(encrypted)
                    if val and val.strip():
                        return val.strip()
        except Exception as e:
            logger.warning(f"DB credential lookup failed for {key}: {e}")

    # 2. Fallback to .env
    env_val = os.environ.get(env_key or key.upper(), "")
    if env_val:
        return env_val

    return default


async def get_billplz_config() -> tuple:
    """Returns (api_key, collection_id, x_sig_key, sandbox)."""
    api_key = await get_credential("billplz_api_key", "BILLPLZ_API_KEY")
    collection_id = await get_credential("billplz_collection_id", "BILLPLZ_COLLECTION_ID")
    x_sig_key = await get_credential("billplz_x_signature_key", "BILLPLZ_X_SIGNATURE_KEY")
    sandbox_str = await get_credential("billplz_sandbox", "BILLPLZ_SANDBOX", "true")
    return api_key, collection_id, x_sig_key, sandbox_str.lower() == "true"


async def get_gcs_config() -> tuple:
    """Returns (bucket_name, creds_json_str) for the main ASSETS bucket. DO NOT USE for teacher uploads or recordings."""
    bucket = await get_credential("gcs_bucket_name", "GCS_BUCKET_NAME")
    creds = await get_credential("gcs_credentials_json", "GCS_CREDENTIALS_JSON")
    return bucket, creds


async def get_gcs_teachers_media_config() -> tuple:
    """Returns (bucket_name, creds_json_str) for teacher video/certificate uploads."""
    bucket = await get_credential("gcs_teachers_media_bucket", "GCS_TEACHERS_MEDIA_BUCKET")
    creds = await get_credential("gcs_credentials_json", "GCS_CREDENTIALS_JSON")
    return bucket, creds


async def get_gcs_recordings_config() -> tuple:
    """Returns (bucket_name, creds_json_str) for class recording uploads."""
    bucket = await get_credential("gcs_recordings_bucket", "GCS_RECORDINGS_BUCKET")
    creds = await get_credential("gcs_credentials_json", "GCS_CREDENTIALS_JSON")
    return bucket, creds


async def get_smtp_config() -> tuple:
    """Returns (email, password, host, port)."""
    email = await get_credential("smtp_email", "SMTP_EMAIL")
    password = await get_credential("smtp_password", "SMTP_PASSWORD")
    host = await get_credential("smtp_host", "SMTP_HOST", "smtp.gmail.com")
    port_str = await get_credential("smtp_port", "SMTP_PORT", "587")
    try:
        port = int(port_str)
    except ValueError:
        port = 587
    return email, password, host, port
