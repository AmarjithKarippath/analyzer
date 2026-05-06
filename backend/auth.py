"""Authentication: SQLite user store, password hashing, JWT, Google ID token verification."""

import logging
import os
import sqlite3
import threading
import time
import traceback
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
import requests as _requests
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

DB_PATH = os.environ.get("AUTH_DB_PATH", "/app/data/users.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", "168"))  # 7 days default
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

# Hard cap so a hung outbound call can't sit past nginx's 60s proxy timeout.
GOOGLE_HTTP_TIMEOUT_SECONDS = float(os.environ.get("GOOGLE_HTTP_TIMEOUT", "10"))

logger = logging.getLogger("auth")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger.setLevel(logging.DEBUG)


def _mask(value: Optional[str], keep: int = 8) -> str:
    if not value:
        return "(empty)"
    if len(value) <= keep * 2:
        return "***"
    return f"{value[:keep]}…{value[-keep:]} (len={len(value)})"


class _TimeoutGoogleRequest(google_requests.Request):
    """google.auth's transport defaults to 120s — longer than nginx's 60s proxy_read_timeout.
    Force a short, explicit timeout so failures surface as 401 (with detail) instead of 504."""

    def __call__(self, url, method="GET", body=None, headers=None,
                 timeout=GOOGLE_HTTP_TIMEOUT_SECONDS, **kwargs):
        return super().__call__(url, method=method, body=body, headers=headers,
                                timeout=timeout, **kwargs)


_google_request_transport = _TimeoutGoogleRequest()

# RLock (re-entrant) instead of Lock: several helpers (get_user_by_id, get_user_by_email)
# acquire this lock, and they may be called from inside another locked section
# (e.g. upsert_google_user → get_user_by_id). With a non-reentrant Lock this deadlocks
# the worker thread, which manifests as a 504 from nginx after the proxy_read_timeout.
_db_lock = threading.RLock()


def _connect():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _db_lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT,
                name TEXT,
                google_sub TEXT UNIQUE,
                provider TEXT NOT NULL DEFAULT 'local',
                created_at INTEGER NOT NULL
            )
            """
        )
        conn.commit()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_jwt(user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXPIRY_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_user_by_email(email: str) -> Optional[sqlite3.Row]:
    with _db_lock, _connect() as conn:
        cur = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower(),))
        return cur.fetchone()


def get_user_by_id(user_id: int) -> Optional[sqlite3.Row]:
    with _db_lock, _connect() as conn:
        cur = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return cur.fetchone()


def get_user_by_google_sub(sub: str) -> Optional[sqlite3.Row]:
    with _db_lock, _connect() as conn:
        cur = conn.execute("SELECT * FROM users WHERE google_sub = ?", (sub,))
        return cur.fetchone()


def get_user_count() -> int:
    """Count total registered users."""
    with _db_lock, _connect() as conn:
        cur = conn.execute("SELECT COUNT(*) as count FROM users")
        row = cur.fetchone()
        return row["count"] if row else 0


def get_all_users() -> list[dict]:
    """Get all registered users (for admin). Returns list of user dicts (excluding passwords)."""
    with _db_lock, _connect() as conn:
        cur = conn.execute(
            "SELECT id, email, name, provider, created_at FROM users ORDER BY created_at DESC"
        )
        return [dict(row) for row in cur.fetchall()]


def create_local_user(email: str, password: str, name: Optional[str] = None) -> sqlite3.Row:
    email = email.lower().strip()
    pw_hash = hash_password(password)
    with _db_lock, _connect() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash, name, provider, created_at) VALUES (?, ?, ?, 'local', ?)",
                (email, pw_hash, name, int(time.time())),
            )
            conn.commit()
            user_id = cur.lastrowid
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Email already registered")
    return get_user_by_id(user_id)


def upsert_google_user(sub: str, email: str, name: Optional[str]) -> sqlite3.Row:
    """Create or update a Google-authenticated user. Also link google_sub to existing local account if email matches."""
    email = email.lower().strip()
    existing = get_user_by_google_sub(sub) or get_user_by_email(email)
    with _db_lock, _connect() as conn:
        if existing is None:
            # New user: insert
            cur = conn.execute(
                "INSERT INTO users (email, name, google_sub, provider, created_at) VALUES (?, ?, ?, 'google', ?)",
                (email, name, sub, int(time.time())),
            )
            conn.commit()
            user_id = cur.lastrowid
        else:
            # Existing user: link google_sub (if not already linked) and update name
            conn.execute(
                "UPDATE users SET google_sub = COALESCE(google_sub, ?), name = COALESCE(?, name) WHERE id = ?",
                (sub, name, existing["id"]),
            )
            conn.commit()
            user_id = existing["id"]
    # Release lock before the final query to avoid re-entrancy issues
    return get_user_by_id(user_id)
#         if existing is None:
#             cur = conn.execute(
#                 "INSERT INTO users (email, name, google_sub, provider, created_at) VALUES (?, ?, ?, 'google', ?)",
#                 (email, name, sub, int(time.time())),
#             )
#             conn.commit()
#             return get_user_by_id(cur.lastrowid)
#         # Link google_sub to an existing local account or update name
#         conn.execute(
#             "UPDATE users SET google_sub = COALESCE(google_sub, ?), name = COALESCE(?, name) WHERE id = ?",
#             (sub, name, existing["id"]),
#         )
#         conn.commit()
#         return get_user_by_id(existing["id"])


def _peek_unverified_claims(token: str) -> dict:
    """Decode the JWT *without* verifying the signature, just to log diagnostic info."""
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        return {"__decode_error__": repr(e)}


def verify_google_id_token(token: str) -> dict:
    logger.info("[google] verify_google_id_token() called: token=%s", _mask(token, keep=10))
    logger.info("[google] server GOOGLE_CLIENT_ID=%s", _mask(GOOGLE_CLIENT_ID, keep=12))

    if not GOOGLE_CLIENT_ID:
        logger.error("[google] GOOGLE_CLIENT_ID env var is empty — cannot verify token")
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_ID not configured on server. Set it in the backend environment.",
        )

    # Peek unverified to surface client_id mismatches BEFORE strict verification (and the
    # network round-trip to fetch Google's JWKS). This makes the failure mode obvious.
    peek = _peek_unverified_claims(token)
    logger.info(
        "[google] unverified claims: aud=%s iss=%s email=%s email_verified=%s sub=%s exp=%s",
        _mask(peek.get("aud"), keep=12),
        peek.get("iss"),
        peek.get("email"),
        peek.get("email_verified"),
        _mask(peek.get("sub"), keep=4),
        peek.get("exp"),
    )

    aud = peek.get("aud")
    if aud and aud != GOOGLE_CLIENT_ID:
        logger.error(
            "[google] CLIENT_ID MISMATCH — token.aud (%s) != server GOOGLE_CLIENT_ID (%s). "
            "Frontend was built with a different client ID than the backend expects.",
            _mask(aud, keep=12), _mask(GOOGLE_CLIENT_ID, keep=12),
        )
        raise HTTPException(
            status_code=401,
            detail="Google token audience does not match server's GOOGLE_CLIENT_ID. "
                   "Make sure the frontend's VITE_GOOGLE_CLIENT_ID and the backend's "
                   "GOOGLE_CLIENT_ID are identical.",
        )

    t0 = time.perf_counter()
    try:
        info = google_id_token.verify_oauth2_token(
            token, _google_request_transport, GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.error("[google] verify_oauth2_token rejected token after %.0fms: %s", elapsed_ms, e)
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")
    except (_requests.Timeout, _requests.ConnectionError) as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.error(
            "[google] NETWORK error fetching Google JWKS after %.0fms: %s\n%s",
            elapsed_ms, e, traceback.format_exc(),
        )
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach Google to verify token (network error). "
                   f"The backend container may have no outbound internet. Underlying: {e}",
        )
    except Exception as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.error(
            "[google] UNEXPECTED error in verify_oauth2_token after %.0fms: %s\n%s",
            elapsed_ms, e, traceback.format_exc(),
        )
        raise HTTPException(status_code=500, detail=f"Google token verification failed: {e!r}")

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "[google] verify_oauth2_token OK in %.0fms: sub=%s email=%s",
        elapsed_ms, _mask(info.get("sub"), keep=4), info.get("email"),
    )

    if info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        logger.error("[google] wrong issuer: %s", info.get("iss"))
        raise HTTPException(status_code=401, detail="Wrong issuer")
    return info


def probe_google_connectivity() -> None:
    """Best-effort startup probe: confirm we can reach Google's cert endpoint.
    Logs only — does not raise — so a transient blip doesn't block the server."""
    if not GOOGLE_CLIENT_ID:
        logger.warning(
            "[google] GOOGLE_CLIENT_ID is NOT set on the backend. /auth/google will return 500 "
            "until you set it (docker-compose.yml: backend.environment.GOOGLE_CLIENT_ID)."
        )
        return
    url = "https://www.googleapis.com/oauth2/v1/certs"
    try:
        t0 = time.perf_counter()
        resp = _requests.get(url, timeout=GOOGLE_HTTP_TIMEOUT_SECONDS)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "[google] startup probe: GET %s -> %d in %.0fms (GOOGLE_CLIENT_ID=%s)",
            url, resp.status_code, elapsed_ms, _mask(GOOGLE_CLIENT_ID, keep=12),
        )
    except Exception as e:
        logger.error(
            "[google] startup probe FAILED — backend cannot reach Google: %s. "
            "/auth/google will time out until network is fixed.",
            e,
        )


_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> sqlite3.Row:
    token = None
    if creds and creds.scheme.lower() == "bearer":
        token = creds.credentials
    if not token:
        # fall back to ?token= query for simple cases
        token = request.query_params.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_jwt(token)
    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


def user_to_dict(user: sqlite3.Row) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "provider": user["provider"],
    }
