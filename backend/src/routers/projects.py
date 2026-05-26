import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db
from src.db_models import Project, Proposal, User, Contract, Milestone, MilestonePayment
from src.auth_utils import get_current_user
from src.schemas import (
    ProjectCreate,
    ProjectOut,
    ProjectListResponse,
    ProjectResponse,
    ProposalCreate,
    ProposalResponse,
    ProposalOut,
    ProposalItemOut,
    ProposalListResponse,
    ProposalScoreOut,
    ProposalEvaluationResponse,
    HireRequest,
    ContractResponse,
    ContractOut,
    UserOut,
)
from src.utils.ai_placeholders import score_proposal_placeholder

router = APIRouter()


def _parse_skills(raw_skills: str | None) -> list[str]:
    try:
        skills = json.loads(raw_skills or "[]")
    except json.JSONDecodeError:
        return []
    return skills if isinstance(skills, list) else []


def _serialize_project(project: Project) -> ProjectOut:
    return ProjectOut(
        id=project.id,
        client_id=project.client_id,
        title=project.title,
        description=project.description,
        skills=_parse_skills(project.skills),
        budget_min=project.budget_min,
        budget_max=project.budget_max,
        status=project.status,
    )


def _serialize_contract(contract: Contract) -> ContractOut:
    return ContractOut(
        id=contract.id,
        project_id=contract.project_id,
        proposal_id=contract.proposal_id,
        client_id=contract.client_id,
        freelancer_id=contract.freelancer_id,
        total_amount=contract.total_amount,
        status=contract.status,
        created_at=contract.created_at,
        completed_at=contract.completed_at,
    )


def _serialize_user(user: User) -> UserOut:
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role, verified=bool(user.verified))


def _project_terms(project: Project) -> list[str]:
    return " ".join([project.title or "", project.description or "", " ".join(_parse_skills(project.skills))]).lower().split()


async def _load_project_or_404(db: AsyncSession, project_id: int) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def _load_proposal_or_404(db: AsyncSession, project_id: int, proposal_id: int) -> Proposal:
    result = await db.execute(select(Proposal).where(Proposal.id == proposal_id, Proposal.project_id == project_id))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    return proposal


async def _create_contract_from_proposal(
    db: AsyncSession,
    project: Project,
    proposal: Proposal,
    current: User,
) -> Contract:
    existing_contract_result = await db.execute(
        select(Contract).where(Contract.project_id == project.id, Contract.status == "active")
    )
    existing_contract = existing_contract_result.scalar_one_or_none()
    if existing_contract:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project already has an active contract")

    contract = Contract(
        project_id=project.id,
        proposal_id=proposal.id,
        client_id=current.id,
        freelancer_id=proposal.freelancer_id,
        total_amount=proposal.amount or 0.0,
        status="active",
    )
    proposal.status = "hired"
    project.status = "in_progress"

    db.add(contract)
    await db.flush()

    milestone_amount = proposal.amount or 0.0
    milestone = Milestone(
        project_id=project.id,
        contract_id=contract.id,
        description=f"Complete {project.title}",
        amount=milestone_amount,
        due_date=datetime.now(timezone.utc) + timedelta(days=max(proposal.duration_days or 7, 1)),
        completed_bool=False,
        approved_bool=False,
    )
    db.add(milestone)
    await db.flush()

    payment = MilestonePayment(
        contract_id=contract.id,
        milestone_id=milestone.id,
        amount=milestone_amount,
        commission_amount=round(milestone_amount * 0.10, 2),
        freelancer_amount=round(milestone_amount * 0.90, 2),
        status="pending",
    )
    db.add(payment)
    db.add(project)
    db.add(proposal)
    await db.commit()
    await db.refresh(contract)
    return contract


@router.get("/projects", response_model=ProjectListResponse)
@router.get("/projects/open", response_model=ProjectListResponse)
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.status == "open").order_by(Project.id.desc()))
    projects = result.scalars().all()
    out: list[ProjectOut] = []
    for p in projects:
        out.append(_serialize_project(p))
    return {"success": True, "data": out}


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await _load_project_or_404(db, project_id)

    return {"success": True, "data": _serialize_project(project)}


@router.post("/projects", response_model=ProjectResponse)
async def create_project(payload: ProjectCreate, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if payload.budget_min is not None and payload.budget_max is not None and payload.budget_min > payload.budget_max:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="budget_min cannot exceed budget_max",
        )

    p = Project(
        client_id=current.id,
        title=payload.title,
        description=payload.description,
        skills=json.dumps(payload.skills or []),
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return {"success": True, "data": _serialize_project(p)}


@router.post("/projects/{project_id}/proposal", response_model=ProposalResponse)
async def submit_proposal(project_id: int, payload: ProposalCreate, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    project = await _load_project_or_404(db, project_id)
    if project.status != "open":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project is not open for proposals")

    cover_message = payload.cover_message
    score = score_proposal_placeholder(_project_terms(project), cover_message)

    proposal = Proposal(
        project_id=project.id,
        freelancer_id=current.id,
        amount=payload.amount,
        duration_days=payload.duration_days,
        cover_message=cover_message,
        score=score,
    )
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)
    data = ProposalOut(proposal_id=proposal.id, score=proposal.score or 0, status=proposal.status or "submitted")
    return {"success": True, "data": data}


@router.get("/projects/{project_id}/proposals", response_model=ProposalListResponse)
async def list_project_proposals(project_id: int, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    project = await _load_project_or_404(db, project_id)
    if project.client_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view these proposals")

    hired_result = await db.execute(select(Contract.proposal_id).where(Contract.project_id == project_id))
    hired_proposal_ids = {proposal_id for (proposal_id,) in hired_result.all()}

    result = await db.execute(
        select(Proposal, User)
        .join(User, Proposal.freelancer_id == User.id)
        .where(Proposal.project_id == project_id)
        .order_by(Proposal.id.desc())
    )
    items: list[ProposalItemOut] = []
    for proposal, freelancer in result.all():
        items.append(
            ProposalItemOut(
                proposal_id=proposal.id,
                project_id=proposal.project_id,
                freelancer_id=proposal.freelancer_id,
                freelancer=_serialize_user(freelancer),
                freelancer_name=freelancer.name,
                amount=proposal.amount,
                duration_days=proposal.duration_days,
                cover_message=proposal.cover_message,
                score=proposal.score or 0,
                status=proposal.status if proposal.status else ("hired" if proposal.id in hired_proposal_ids else "submitted"),
            )
        )

    return {"success": True, "data": items}


@router.post("/projects/{project_id}/evaluate", response_model=ProposalEvaluationResponse)
async def evaluate_project_proposals(project_id: int, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    project = await _load_project_or_404(db, project_id)
    if project.client_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to evaluate these proposals")

    result = await db.execute(select(Proposal).where(Proposal.project_id == project_id).order_by(Proposal.id.desc()))
    scores = [ProposalScoreOut(proposal_id=proposal.id, score=proposal.score or 0) for proposal in result.scalars().all()]
    return {"success": True, "data": scores}


@router.post("/contracts", response_model=ContractResponse)
async def create_contract(payload: HireRequest, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    proposal_result = await db.execute(select(Proposal).where(Proposal.id == payload.proposal_id))
    proposal = proposal_result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    project = await _load_project_or_404(db, proposal.project_id)
    if project.client_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to hire for this project")

    contract = await _create_contract_from_proposal(db, project, proposal, current)
    return {"success": True, "data": _serialize_contract(contract)}


@router.post("/projects/{project_id}/hire", response_model=ContractResponse)
async def hire_proposal(project_id: int, payload: HireRequest, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    project = await _load_project_or_404(db, project_id)
    if project.client_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to hire for this project")

    proposal = await _load_proposal_or_404(db, project_id, payload.proposal_id)
    contract = await _create_contract_from_proposal(db, project, proposal, current)
    return {"success": True, "data": _serialize_contract(contract)}
