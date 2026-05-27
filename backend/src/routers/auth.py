import os

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db
from src.db_models import User
from src.schemas import UserCreate, LoginRequest, AuthResponse, UserResponse, ApiSuccess

from src.auth_utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user,
    store_refresh_token,
    validate_refresh_token,
    revoke_refresh_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

router = APIRouter()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, access_max_age: int, refresh_max_age: int) -> None:
    secure = os.environ.get("TS_COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=access_max_age,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=refresh_max_age,
        path="/",
    )


@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # check if email exists
    result = await db.execute(select(User).where(User.email == user.email))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed = get_password_hash(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed,
        role=user.role
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {"success": True, "data": new_user}


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token, refresh_expires = create_refresh_token()
    await store_refresh_token(db, user.id, refresh_token, refresh_expires)

    _set_auth_cookies(
        response,
        access_token=access_token,
        refresh_token=refresh_token,
        access_max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        refresh_max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return {
        "success": True,
        "data": {
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
    }


@router.get("/me", response_model=UserResponse)
async def me(current=Depends(get_current_user)):
    return {"success": True, "data": current}


@router.post("/refresh", response_model=AuthResponse)
async def refresh(response: Response, request: Request, db: AsyncSession = Depends(get_db)):
    raw_refresh = request.cookies.get("refresh_token")
    if not raw_refresh:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    token = await validate_refresh_token(db, raw_refresh)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    await revoke_refresh_token(db, raw_refresh)

    res = await db.execute(select(User).where(User.id == token.user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token, refresh_expires = create_refresh_token()
    await store_refresh_token(db, user.id, refresh_token, refresh_expires)

    _set_auth_cookies(
        response,
        access_token=access_token,
        refresh_token=refresh_token,
        access_max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        refresh_max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return {
        "success": True,
        "data": {
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
    }


@router.post("/logout", response_model=ApiSuccess)
async def logout(response: Response, request: Request, db: AsyncSession = Depends(get_db)):
    raw_refresh = request.cookies.get("refresh_token")
    if raw_refresh:
        await revoke_refresh_token(db, raw_refresh)

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"success": True, "message": "Logged out"}