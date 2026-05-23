import json

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db
from src.db_models import Project, Proposal
from src.auth_utils import get_current_user

router = APIRouter()


@router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    out = []
    for p in projects:
        out.append({"id": p.id, "client_id": p.client_id, "title": p.title, "description": p.description, "skills": json.loads(p.skills or "[]"), "budget_min": p.budget_min, "budget_max": p.budget_max, "status": p.status})
    return out


@router.post("/projects")
async def create_project(payload: dict, db: AsyncSession = Depends(get_db)):
    # minimal create: client_id required
    client_id = payload.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="client_id required")
    p = Project(client_id=client_id, title=payload.get("title"), description=payload.get("description"), skills=json.dumps(payload.get("skills") or []), budget_min=payload.get("budget_min"), budget_max=payload.get("budget_max"))
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return {"id": p.id, "title": p.title, "skills": json.loads(p.skills or "[]")}


@router.post("/projects/{project_id}/proposal")
async def submit_proposal(project_id: int, payload: dict, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not payload.get("amount") or not payload.get("duration_days") or not payload.get("cover_message"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="amount, duration_days, and cover_message are required")

    cover_message = str(payload.get("cover_message"))
    project_terms = " ".join([project.title or "", project.description or "", " ".join(json.loads(project.skills or "[]"))]).lower()
    cover_terms = cover_message.lower()
    overlap_score = sum(1 for token in set(project_terms.split()) if len(token) > 3 and token in cover_terms)
    score = min(100, 55 + overlap_score * 7 + min(len(cover_message) // 40, 10))

    proposal = Proposal(
        project_id=project.id,
        freelancer_id=current.id,
        amount=payload.get("amount"),
        duration_days=payload.get("duration_days"),
        cover_message=cover_message,
        score=score,
    )
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)
    return {"proposal_id": proposal.id, "score": proposal.score, "status": "submitted"}
