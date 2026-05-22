from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db
from src.db_models import User
from src.schemas import UserCreate, UserOut, Token


router = APIRouter()

@router.post("/signup", response_model=UserOut)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):

    # check if email exists
    result = await db.execute(select(User).where(User.email == user.email))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=user.password,  # later: hash this
        role=user.role
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user

# Temporary endpoint to list users for dev purposes
@router.get("/users", response_model=list[UserOut])
async def get_users(db: AsyncSession = Depends(get_db)):

    result = await db.execute(select(User))
    users = result.scalars().all()

    return users

@router.post("/token", response_model=Token)
def token():
    return {"access_token": "devtoken", "token_type": "bearer"}