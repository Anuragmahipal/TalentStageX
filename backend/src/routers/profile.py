from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from src.db import get_db
from src.db_models import User, Profile
from src.auth_utils import get_current_user
from src.schemas import ProfileIn, ProfileOut
from src.utils.profile import compute_profile_completeness

router = APIRouter()


@router.get("/profile", response_model=ProfileOut)
async def get_profile(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current.id
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        return ProfileOut(id=None, user_id=current.id, title=None, bio=None, hourly_rate=None, completeness_pct=0)

    # ensure completeness is up to date (fast compute)
    pct, breakdown = await compute_profile_completeness(db, user_id)
    # persist if different
    if profile.completeness_pct != pct:
        profile.completeness_pct = pct
        db.add(profile)
        await db.commit()

    return ProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        title=profile.title,
        bio=profile.bio,
        hourly_rate=profile.hourly_rate,
        completeness_pct=pct,
        completeness_breakdown=breakdown,
    )


@router.put("/profile", response_model=ProfileOut)
async def update_profile(payload: ProfileIn, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current.id
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        # create
        new = Profile(user_id=user_id, title=payload.title, bio=payload.bio, hourly_rate=payload.hourly_rate)
        db.add(new)
        await db.commit()
        await db.refresh(new)
        pct, breakdown = await compute_profile_completeness(db, user_id)
        new.completeness_pct = pct
        db.add(new)
        await db.commit()
        return ProfileOut(id=new.id, user_id=new.user_id, title=new.title, bio=new.bio, hourly_rate=new.hourly_rate, completeness_pct=pct, completeness_breakdown=breakdown)

    # update fields
    profile.title = payload.title
    profile.bio = payload.bio
    profile.hourly_rate = payload.hourly_rate
    db.add(profile)
    await db.commit()

    pct, breakdown = await compute_profile_completeness(db, user_id)
    profile.completeness_pct = pct
    db.add(profile)
    await db.commit()

    return ProfileOut(id=profile.id, user_id=profile.user_id, title=profile.title, bio=profile.bio, hourly_rate=profile.hourly_rate, completeness_pct=pct, completeness_breakdown=breakdown)
