import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db
from src.db_models import Profile, PortfolioItem, SkillBadge, User, VerificationRequest
from src.auth_utils import get_current_user
from src.schemas import (
    ProfileOut,
    ProfileResponse,
    ProfileUpdate,
    ProfileCompletenessResponse,
    ProfileCompletenessOut,
    PortfolioItemCreate,
    PortfolioItemOut,
    PortfolioListResponse,
    PortfolioItemUpdate,
    VerificationRequestCreate,
    VerificationResponse,
)
from src.utils.profile import compute_profile_completeness

router = APIRouter()


async def _get_profile(db: AsyncSession, user_id: int) -> Profile | None:
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    return result.scalar_one_or_none()


async def _load_portfolio_items(db: AsyncSession, user_id: int) -> list[PortfolioItemOut]:
    result = await db.execute(select(PortfolioItem).where(PortfolioItem.user_id == user_id).order_by(PortfolioItem.id.desc()))
    items = []
    for item in result.scalars().all():
        items.append(
            PortfolioItemOut(
                id=item.id,
                user_id=item.user_id,
                title=item.title,
                description=item.description,
                tools=json.loads(item.tools or "[]") if item.tools else [],
                media_url=item.media_url,
                link=item.link,
                created_at=item.created_at,
            )
        )
    return items


async def _load_profile_portfolio_json(profile: Profile | None) -> list[dict]:
    if not profile or not profile.portfolio_items:
        return []
    try:
        parsed = json.loads(profile.portfolio_items)
    except json.JSONDecodeError:
        return []
    return parsed if isinstance(parsed, list) else []


async def _load_profile_skills_json(profile: Profile | None) -> list[str]:
    if not profile or not profile.skills:
        return []
    try:
        parsed = json.loads(profile.skills)
    except json.JSONDecodeError:
        return []
    return parsed if isinstance(parsed, list) else []


def _serialize_portfolio_item(item: PortfolioItem) -> PortfolioItemOut:
    return PortfolioItemOut(
        id=item.id,
        user_id=item.user_id,
        title=item.title,
        description=item.description,
        tools=json.loads(item.tools or "[]") if item.tools else [],
        media_url=item.media_url,
        link=item.link,
        created_at=item.created_at,
    )


def _serialize_profile(
    profile: Profile | None,
    user_id: int,
    pct: int,
    breakdown: dict,
    portfolio_items: list[dict] | None = None,
) -> ProfileOut:
    legacy_portfolio_items = []
    skills = []
    if profile:
        skills = json.loads(profile.skills or "[]") if profile.skills else []
        legacy_portfolio_items = json.loads(profile.portfolio_items or "[]") if profile.portfolio_items else []
    resolved_portfolio_items = portfolio_items if portfolio_items is not None else legacy_portfolio_items
    return ProfileOut(
        id=profile.id if profile else None,
        user_id=user_id,
        title=profile.title if profile else None,
        bio=profile.bio if profile else None,
        hourly_rate=profile.hourly_rate if profile else None,
        photo_url=profile.photo_url if profile else None,
        skills=skills,
        portfolio_items=resolved_portfolio_items,
        verified=bool(profile.user.verified) if profile and profile.user else False,
        completeness_pct=pct,
        completeness_breakdown=breakdown,
    )


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current.id
    profile = await _get_profile(db, user_id)
    pct, breakdown = await compute_profile_completeness(db, user_id)
    portfolio_items = await _load_portfolio_items(db, user_id)
    if profile and profile.completeness_pct != pct:
        profile.completeness_pct = pct
        db.add(profile)
        await db.commit()
    return {"success": True, "data": _serialize_profile(profile, user_id, pct, breakdown, [item.model_dump() for item in portfolio_items])}


@router.get("/profile/completeness", response_model=ProfileCompletenessResponse)
async def get_profile_completeness(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    pct, breakdown = await compute_profile_completeness(db, current.id)
    data = ProfileCompletenessOut(percent=pct, completeness_pct=pct, completeness_breakdown=breakdown)
    return {"success": True, "data": data}


@router.get("/portfolio", response_model=PortfolioListResponse)
async def list_portfolio(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    items = await _load_portfolio_items(db, current.id)
    return {"success": True, "data": items}


@router.post("/portfolio", response_model=PortfolioItemOut)
async def create_portfolio_item(payload: PortfolioItemCreate, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    item = PortfolioItem(
        user_id=current.id,
        title=payload.title,
        description=payload.description,
        tools=json.dumps(payload.tools or []),
        media_url=payload.media_url,
        link=payload.link,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _serialize_portfolio_item(item)


@router.put("/portfolio/{item_id}", response_model=PortfolioItemOut)
async def update_portfolio_item(item_id: int, payload: PortfolioItemUpdate, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PortfolioItem).where(PortfolioItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found")
    if item.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to edit this portfolio item")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field == "tools" and value is not None:
            setattr(item, field, json.dumps(value))
            continue
        setattr(item, field, value)

    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _serialize_portfolio_item(item)


@router.delete("/portfolio/{item_id}", response_model=ProfileResponse)
async def delete_portfolio_item(item_id: int, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PortfolioItem).where(PortfolioItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found")
    if item.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this portfolio item")

    await db.delete(item)
    await db.commit()
    profile = await _get_profile(db, current.id)
    pct, breakdown = await compute_profile_completeness(db, current.id)
    portfolio_items = await _load_portfolio_items(db, current.id)
    return {"success": True, "data": _serialize_profile(profile, current.id, pct, breakdown, [item.model_dump() for item in portfolio_items])}


@router.post("/user/{user_id}/verify", response_model=VerificationResponse)
@router.post("/users/{user_id}/verify", response_model=VerificationResponse)
async def verify_user(user_id: int, payload: VerificationRequestCreate, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to verify this user")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    verification = VerificationRequest(
        user_id=user_id,
        proof_url=payload.proof_url,
        verification_method=payload.verification_method or "manual",
        status="approved",
    )
    user.verified = True
    db.add(user)
    db.add(verification)
    await db.commit()
    await db.refresh(user)
    return {"success": True, "data": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "verified": user.verified}}


@router.post("/profile", response_model=ProfileResponse)
@router.put("/profile", response_model=ProfileResponse)
async def update_profile(payload: ProfileUpdate, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current.id
    profile = await _get_profile(db, user_id)
    if not profile:
        profile = Profile(user_id=user_id)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field in {"skills", "portfolio_items"} and value is not None:
            setattr(profile, field, json.dumps(value))
            continue
        setattr(profile, field, value)

    db.add(profile)
    await db.flush()
    pct, breakdown = await compute_profile_completeness(db, user_id)
    profile.completeness_pct = pct

    await db.commit()
    await db.refresh(profile)

    return {"success": True, "data": _serialize_profile(profile, user_id, pct, breakdown)}
