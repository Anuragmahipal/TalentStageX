"""
AI-powered endpoints:
  POST /ai/brief           — generate a project brief from a short prompt
  POST /ai/match/{project_id} — rank freelancers for a project
"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.db import get_db
from src.db_models import User, Profile, Project, PortfolioItem, Review
from src.auth_utils import get_current_user
from src.schemas import (
    BriefGenerateRequest,
    BriefGenerateResponse,
    GeneratedBrief,
    MatchRequest,
    MatchResponse,
    FreelancerMatchOut,
)
from src.utils.ai_service import generate_brief, match_freelancers

router = APIRouter()


def _parse_json_list(raw: str | None) -> list:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


@router.post("/ai/brief", response_model=BriefGenerateResponse)
async def generate_project_brief(
    payload: BriefGenerateRequest,
    current=Depends(get_current_user),
):
    """
    Turn a short client description into a structured project brief.
    Accessible to all authenticated users (clients posting, freelancers previewing).
    """
    brief_dict = await generate_brief(payload.prompt)

    # Clamp/validate fields
    brief_dict["budget_min"] = max(0, int(brief_dict.get("budget_min", 500)))
    brief_dict["budget_max"] = max(brief_dict["budget_min"], int(brief_dict.get("budget_max", 2000)))
    brief_dict["timeline_days"] = max(1, int(brief_dict.get("timeline_days", 14)))
    brief_dict["skills"] = [str(s) for s in brief_dict.get("skills", []) if s][:10]
    brief_dict["title"] = str(brief_dict.get("title", "New Project"))[:256]
    brief_dict["description"] = str(brief_dict.get("description", ""))[:4000]
    brief_dict["next_step"] = str(brief_dict.get("next_step", "Post your project to receive proposals."))[:512]

    return {"success": True, "data": GeneratedBrief(**brief_dict)}


@router.post("/ai/match/{project_id}", response_model=MatchResponse)
async def match_freelancers_for_project(
    project_id: int,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return top-ranked freelancers for a given project.
    Only the project owner (client) may call this.
    """
    # Load project
    proj_result = await db.execute(select(Project).where(Project.id == project_id))
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.client_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your project")

    project_dict = {
        "id": project.id,
        "title": project.title,
        "description": project.description or "",
        "skills": _parse_json_list(project.skills),
        "budget_min": project.budget_min,
        "budget_max": project.budget_max,
    }

    # Load all freelancer users + profiles
    result = await db.execute(
        select(User, Profile)
        .outerjoin(Profile, Profile.user_id == User.id)
        .where(User.role == "freelancer")
    )
    rows = result.all()

    # Per-freelancer portfolio count
    portfolio_counts: dict[int, int] = {}
    pc_result = await db.execute(
        select(PortfolioItem.user_id, func.count(PortfolioItem.id).label("cnt"))
        .group_by(PortfolioItem.user_id)
    )
    for uid, cnt in pc_result.all():
        portfolio_counts[uid] = cnt

    # Per-freelancer average rating
    avg_ratings: dict[int, float] = {}
    rating_result = await db.execute(
        select(Review.freelancer_id, func.avg(Review.rating).label("avg_rating"))
        .group_by(Review.freelancer_id)
    )
    for uid, avg in rating_result.all():
        avg_ratings[uid] = round(float(avg), 2)

    freelancer_dicts = []
    for fl_user, fl_profile in rows:
        freelancer_dicts.append({
            "freelancer_id": fl_user.id,
            "name": fl_user.name,
            "title": fl_profile.title if fl_profile else None,
            "bio": fl_profile.bio if fl_profile else None,
            "hourly_rate": fl_profile.hourly_rate if fl_profile else None,
            "skills": _parse_json_list(fl_profile.skills if fl_profile else None),
            "verified": bool(fl_user.verified),
            "portfolio_count": portfolio_counts.get(fl_user.id, 0),
            "avg_rating": avg_ratings.get(fl_user.id),
        })

    if not freelancer_dicts:
        return {"success": True, "data": []}

    scores = await match_freelancers(project_dict, freelancer_dicts)

    # Build score lookup
    score_map = {s["freelancer_id"]: s for s in scores}

    # Assemble final output (top 10)
    fl_map = {fl["freelancer_id"]: fl for fl in freelancer_dicts}
    out: list[FreelancerMatchOut] = []
    for s in scores[:10]:
        fid = s["freelancer_id"]
        fl = fl_map.get(fid)
        if not fl:
            continue
        out.append(
            FreelancerMatchOut(
                freelancer_id=fid,
                name=fl["name"],
                title=fl.get("title"),
                hourly_rate=fl.get("hourly_rate"),
                skills=fl.get("skills", []),
                verified=fl.get("verified", False),
                match_score=s.get("match_score", 0),
                match_reason=s.get("match_reason", ""),
                portfolio_count=fl.get("portfolio_count", 0),
                avg_rating=fl.get("avg_rating"),
            )
        )

    return {"success": True, "data": out}
