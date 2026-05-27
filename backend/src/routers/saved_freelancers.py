"""
Saved/pinned freelancers endpoints.

Client-only: save, unsave, list.
"""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from src.db import get_db
from src.db_models import SavedFreelancer, User, Profile
from src.auth_utils import get_current_user
from src.schemas import (
    SavedFreelancerOut,
    SavedFreelancerListResponse,
    SavedToggleResponse,
)

router = APIRouter()


def _parse_skills(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _serialize_saved(saved: SavedFreelancer, fl_user: User, fl_profile: Profile | None) -> SavedFreelancerOut:
    return SavedFreelancerOut(
        id=saved.id,
        client_id=saved.client_id,
        freelancer_id=saved.freelancer_id,
        freelancer_name=fl_user.name,
        freelancer_title=fl_profile.title if fl_profile else None,
        freelancer_hourly_rate=fl_profile.hourly_rate if fl_profile else None,
        freelancer_skills=_parse_skills(fl_profile.skills if fl_profile else None),
        freelancer_verified=bool(fl_user.verified),
        created_at=saved.created_at,
    )


@router.get("/saved-freelancers", response_model=SavedFreelancerListResponse)
async def list_saved_freelancers(
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current.role != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can view saved freelancers")

    result = await db.execute(
        select(SavedFreelancer)
        .where(SavedFreelancer.client_id == current.id)
        .order_by(SavedFreelancer.created_at.desc())
    )
    saved_rows = result.scalars().all()

    out = []
    for saved in saved_rows:
        fl_result = await db.execute(select(User).where(User.id == saved.freelancer_id))
        fl_user = fl_result.scalar_one_or_none()
        if not fl_user:
            continue
        profile_result = await db.execute(select(Profile).where(Profile.user_id == saved.freelancer_id))
        fl_profile = profile_result.scalar_one_or_none()
        out.append(_serialize_saved(saved, fl_user, fl_profile))

    return {"success": True, "data": out}


@router.post("/saved-freelancers/{freelancer_id}", response_model=SavedToggleResponse)
async def save_freelancer(
    freelancer_id: int,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current.role != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can save freelancers")

    # Verify target is a freelancer
    fl_result = await db.execute(select(User).where(User.id == freelancer_id))
    fl_user = fl_result.scalar_one_or_none()
    if not fl_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer not found")
    if fl_user.role != "freelancer":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target user is not a freelancer")

    # Check if already saved
    existing = await db.execute(
        select(SavedFreelancer).where(
            and_(
                SavedFreelancer.client_id == current.id,
                SavedFreelancer.freelancer_id == freelancer_id,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already saved")

    saved = SavedFreelancer(client_id=current.id, freelancer_id=freelancer_id)
    db.add(saved)
    await db.commit()
    return {"success": True, "data": {"saved": True, "freelancer_id": freelancer_id}}


@router.delete("/saved-freelancers/{freelancer_id}", response_model=SavedToggleResponse)
async def unsave_freelancer(
    freelancer_id: int,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current.role != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can unsave freelancers")

    result = await db.execute(
        select(SavedFreelancer).where(
            and_(
                SavedFreelancer.client_id == current.id,
                SavedFreelancer.freelancer_id == freelancer_id,
            )
        )
    )
    saved = result.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not saved")

    await db.delete(saved)
    await db.commit()
    return {"success": True, "data": {"saved": False, "freelancer_id": freelancer_id}}


@router.get("/saved-freelancers/check/{freelancer_id}", response_model=SavedToggleResponse)
async def check_saved(
    freelancer_id: int,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current.role != "client":
        return {"success": True, "data": {"saved": False, "freelancer_id": freelancer_id}}

    result = await db.execute(
        select(SavedFreelancer).where(
            and_(
                SavedFreelancer.client_id == current.id,
                SavedFreelancer.freelancer_id == freelancer_id,
            )
        )
    )
    is_saved = result.scalar_one_or_none() is not None
    return {"success": True, "data": {"saved": is_saved, "freelancer_id": freelancer_id}}
