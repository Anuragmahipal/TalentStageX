from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db
from src.db_models import Project, Proposal

router = APIRouter()


@router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    out = []
    for p in projects:
        out.append({"id": p.id, "title": p.title, "description": p.description, "budget_min": p.budget_min, "budget_max": p.budget_max, "status": p.status})
    return out


@router.post("/projects")
async def create_project(payload: dict, db: AsyncSession = Depends(get_db)):
    # minimal create: client_id required
    client_id = payload.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="client_id required")
    p = Project(client_id=client_id, title=payload.get("title"), description=payload.get("description"), budget_min=payload.get("budget_min"), budget_max=payload.get("budget_max"))
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return {"id": p.id, "title": p.title}
