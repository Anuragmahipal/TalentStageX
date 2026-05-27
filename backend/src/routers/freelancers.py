"""
Public freelancer browsing endpoint.
Returns all users with role=freelancer along with their profiles.
Accessible to authenticated users (clients mainly use this).
"""
import json

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.db import get_db
from src.db_models import User, Profile, PortfolioItem, Review
from src.auth_utils import get_current_user
from src.schemas import ApiSuccess

router = APIRouter()


def _parse_skills(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


@router.get("/freelancers")
async def list_freelancers(
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all freelancers with basic profile info."""
    result = await db.execute(
        select(User, Profile)
        .outerjoin(Profile, Profile.user_id == User.id)
        .where(User.role == "freelancer")
        .order_by(User.id.asc())
    )
    rows = result.all()

    # Portfolio counts
    pc_result = await db.execute(
        select(PortfolioItem.user_id, func.count(PortfolioItem.id).label("cnt"))
        .group_by(PortfolioItem.user_id)
    )
    portfolio_counts = {uid: cnt for uid, cnt in pc_result.all()}

    # Average ratings
    rating_result = await db.execute(
        select(Review.freelancer_id, func.avg(Review.rating).label("avg"))
        .group_by(Review.freelancer_id)
    )
    avg_ratings = {uid: round(float(avg), 2) for uid, avg in rating_result.all()}

    out = []
    for fl_user, fl_profile in rows:
        out.append({
            "id": fl_user.id,
            "name": fl_user.name,
            "title": fl_profile.title if fl_profile else None,
            "hourly_rate": fl_profile.hourly_rate if fl_profile else None,
            "skills": _parse_skills(fl_profile.skills if fl_profile else None),
            "bio": fl_profile.bio if fl_profile else None,
            "photo_url": fl_profile.photo_url if fl_profile else None,
            "verified": bool(fl_user.verified),
            "portfolio_count": portfolio_counts.get(fl_user.id, 0),
            "avg_rating": avg_ratings.get(fl_user.id),
            "completeness_pct": fl_profile.completeness_pct if fl_profile else 0,
        })

    return {"success": True, "data": out}
