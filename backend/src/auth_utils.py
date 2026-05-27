"""Authentication utilities (moved from src/auth.py).

This module exposes password hashing, JWT helpers, and the FastAPI
dependency to retrieve the current user.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import hashlib
import secrets

from passlib.context import CryptContext
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db
from src.db_models import User, RefreshToken

SECRET = os.environ.get("TS_SECRET", "dev-secret-change-me-please-32-bytes-min")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120
REFRESH_TOKEN_EXPIRE_DAYS = 14

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return pwd_context.verify(plain, hashed)
    except Exception as e:
        raise RuntimeError(
            "bcrypt backend not available or misconfigured. Install the 'bcrypt' package (pip install bcrypt) "
            "and ensure OS build deps are present. Original error: %s" % e
        )


def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception as e:
        raise RuntimeError(
            "bcrypt backend not available or misconfigured. Install the 'bcrypt' package (pip install bcrypt) "
            "and ensure OS build deps are present. Original error: %s" % e
        )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)


def create_refresh_token() -> tuple[str, datetime]:
    token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return token, expires_at


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_access_token_from_request(request: Request, credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    if credentials and credentials.scheme.lower() == "bearer":
        return credentials.credentials
    return request.cookies.get("access_token")


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    token = get_access_token_from_request(request, credentials)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    payload = decode_access_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    res = await db.execute(select(User).where(User.id == int(sub)))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def store_refresh_token(db: AsyncSession, user_id: int, raw_token: str, expires_at: datetime) -> None:
    token = RefreshToken(user_id=user_id, token_hash=hash_token(raw_token), expires_at=expires_at, revoked=False)
    db.add(token)
    await db.commit()


async def revoke_refresh_token(db: AsyncSession, raw_token: str) -> None:
    token_hash = hash_token(raw_token)
    res = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    token = res.scalar_one_or_none()
    if token:
        token.revoked = True
        db.add(token)
        await db.commit()


async def validate_refresh_token(db: AsyncSession, raw_token: str) -> Optional[RefreshToken]:
    token_hash = hash_token(raw_token)
    res = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    token = res.scalar_one_or_none()
    if not token or token.revoked:
        return None
    if token.expires_at <= datetime.now(timezone.utc):
        return None
    return token
