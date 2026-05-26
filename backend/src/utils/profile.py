import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db_models import User, Profile, PortfolioItem, SkillBadge


def _parse_json_list(raw_value: str | None) -> list:
    if not raw_value:
        return []
    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError:
        return []
    return parsed if isinstance(parsed, list) else []


async def compute_profile_completeness(db: AsyncSession, user_id: int) -> tuple[int, dict]:
    """Compute a profile completeness score from the README-facing profile fields."""
    breakdown: dict[str, int] = {}
    score = 0

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    has_name = bool(user and getattr(user, "name", None))
    has_verified = bool(user and getattr(user, "verified", False))
    breakdown["name"] = 10 if has_name else 0
    breakdown["verified"] = 5 if has_verified else 0
    score += breakdown["name"]
    score += breakdown["verified"]

    res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = res.scalar_one_or_none()
    has_title = bool(profile and profile.title)
    has_bio = bool(profile and profile.bio)
    has_rate = bool(profile and profile.hourly_rate is not None)
    has_photo = bool(profile and profile.photo_url)
    skills = _parse_json_list(profile.skills) if profile else []
    portfolio_items = _parse_json_list(profile.portfolio_items) if profile else []

    skill_badge_result = await db.execute(select(SkillBadge.id).where(SkillBadge.user_id == user_id))
    has_skill_badges = skill_badge_result.first() is not None

    portfolio_result = await db.execute(select(PortfolioItem.id).where(PortfolioItem.user_id == user_id))
    has_portfolio_items = portfolio_result.first() is not None

    has_skills = bool(skills or has_skill_badges)
    has_portfolio = bool(portfolio_items or has_portfolio_items)

    breakdown["title"] = 15 if has_title else 0
    breakdown["bio"] = 15 if has_bio else 0
    breakdown["hourly_rate"] = 10 if has_rate else 0
    breakdown["photo_url"] = 5 if has_photo else 0
    breakdown["skills"] = 20 if has_skills else 0
    breakdown["portfolio_items"] = 20 if has_portfolio else 0
    score += sum(
        breakdown[key]
        for key in ("title", "bio", "hourly_rate", "photo_url", "skills", "portfolio_items")
    )

    pct = int(score)
    if pct < 0:
        pct = 0
    if pct > 100:
        pct = 100

    return pct, breakdown
