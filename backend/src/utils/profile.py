from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.db_models import User, Profile, Proposal


async def compute_profile_completeness(db: AsyncSession, user_id: int) -> tuple[int, dict]:
    """Compute a simple completeness pct from available data.

    Scoring (sum -> 100):
      - name present: 20
      - title present: 20
      - bio present: 20
      - hourly_rate present: 20
      - has proposals: 20

    Returns (pct, breakdown)
    """
    breakdown = {}
    score = 0

    # user
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    has_name = bool(user and getattr(user, "name", None))
    breakdown["name"] = 20 if has_name else 0
    score += breakdown["name"]

    # profile
    res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = res.scalar_one_or_none()
    has_title = bool(profile and profile.title)
    has_bio = bool(profile and profile.bio)
    has_rate = bool(profile and profile.hourly_rate is not None)
    breakdown["title"] = 20 if has_title else 0
    breakdown["bio"] = 20 if has_bio else 0
    breakdown["hourly_rate"] = 20 if has_rate else 0
    score += breakdown["title"] + breakdown["bio"] + breakdown["hourly_rate"]

    # proposals/activity
    res = await db.execute(select(func.count(Proposal.id)).where(Proposal.freelancer_id == user_id))
    cnt = res.scalar_one() or 0
    has_props = cnt > 0
    breakdown["has_proposals"] = 20 if has_props else 0
    score += breakdown["has_proposals"]

    pct = int(score)
    if pct < 0:
        pct = 0
    if pct > 100:
        pct = 100

    return pct, breakdown
