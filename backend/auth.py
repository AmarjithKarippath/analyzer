"""Authentication: SQLite user store, password hashing, JWT, Google ID token verification."""

import os
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

DB_PATH = os.environ.get("AUTH_DB_PATH", "/app/data/users.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", "168"))  # 7 days default
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

_db_lock = threading.Lock()


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
    email = email.lower().strip()
    existing = get_user_by_google_sub(sub) or get_user_by_email(email)
    with _db_lock, _connect() as conn:
        if existing is None:
            cur = conn.execute(
                "INSERT INTO users (email, name, google_sub, provider, created_at) VALUES (?, ?, ?, 'google', ?)",
                (email, name, sub, int(time.time())),
            )
            conn.commit()
            return get_user_by_id(cur.lastrowid)
        # Link google_sub to an existing local account or update name
        conn.execute(
            "UPDATE users SET google_sub = COALESCE(google_sub, ?), name = COALESCE(?, name) WHERE id = ?",
            (sub, name, existing["id"]),
        )
        conn.commit()
        return get_user_by_id(existing["id"])


def verify_google_id_token(token: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured on server")
    try:
        info = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")
    if info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(status_code=401, detail="Wrong issuer")
    return info


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
