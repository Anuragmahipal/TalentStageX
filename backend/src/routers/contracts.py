from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.auth_utils import get_current_user
from src.db import get_db
from src.db_models import Contract, Milestone, MilestonePayment, Deliverable, Review, Project
from src.schemas import (
    ContractOut,
    ContractDetailOut,
    ContractDetailResponse,
    ContractListResponse,
    MilestoneOut,
    MilestonePaymentOut,
    DeliverableOut,
    DeliverableCreate,
    DeliverableResponse,
    MilestoneApprovalResponse,
    ReviewCreate,
    ReviewOut,
    EarningsOut,
    EarningsResponse,
)

router = APIRouter()


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


def _serialize_milestone(milestone: Milestone) -> MilestoneOut:
    return MilestoneOut(
        id=milestone.id,
        project_id=milestone.project_id,
        contract_id=milestone.contract_id,
        description=milestone.description,
        amount=milestone.amount,
        due_date=milestone.due_date,
        completed_bool=bool(milestone.completed_bool),
        approved_bool=bool(milestone.approved_bool),
        completed_at=milestone.completed_at,
        approved_at=milestone.approved_at,
    )


def _serialize_payment(payment: MilestonePayment) -> MilestonePaymentOut:
    return MilestonePaymentOut(
        id=payment.id,
        contract_id=payment.contract_id,
        milestone_id=payment.milestone_id,
        amount=payment.amount,
        commission_amount=payment.commission_amount,
        freelancer_amount=payment.freelancer_amount,
        status=payment.status,
        paid_date=payment.paid_date,
    )


def _serialize_deliverable(deliverable: Deliverable) -> DeliverableOut:
    return DeliverableOut(
        id=deliverable.id,
        contract_id=deliverable.contract_id,
        milestone_id=deliverable.milestone_id,
        file_name=deliverable.file_name,
        file_url=deliverable.file_url,
        notes=deliverable.notes,
        uploaded_by=deliverable.uploaded_by,
        created_at=deliverable.created_at,
    )


def _serialize_review(review: Review | None) -> ReviewOut | None:
    if not review:
        return None
    return ReviewOut(
        id=review.id,
        contract_id=review.contract_id,
        client_id=review.client_id,
        freelancer_id=review.freelancer_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


async def _load_contract_or_404(db: AsyncSession, contract_id: int) -> Contract:
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return contract


async def _load_detail(db: AsyncSession, contract: Contract) -> ContractDetailOut:
    milestones_result = await db.execute(select(Milestone).where(Milestone.contract_id == contract.id).order_by(Milestone.id.asc()))
    payment_result = await db.execute(select(MilestonePayment).where(MilestonePayment.contract_id == contract.id).order_by(MilestonePayment.id.asc()))
    deliverable_result = await db.execute(select(Deliverable).where(Deliverable.contract_id == contract.id).order_by(Deliverable.id.asc()))
    review_result = await db.execute(select(Review).where(Review.contract_id == contract.id))
    review = review_result.scalar_one_or_none()

    return ContractDetailOut(
        contract=_serialize_contract(contract),
        milestones=[_serialize_milestone(item) for item in milestones_result.scalars().all()],
        payments=[_serialize_payment(item) for item in payment_result.scalars().all()],
        deliverables=[_serialize_deliverable(item) for item in deliverable_result.scalars().all()],
        review=_serialize_review(review),
    )


async def _ensure_access(contract: Contract, current_user_id: int) -> None:
    if current_user_id not in {contract.client_id, contract.freelancer_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this contract")


@router.get("/contracts", response_model=ContractListResponse)
async def list_contracts(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Contract)
        .where((Contract.client_id == current.id) | (Contract.freelancer_id == current.id))
        .order_by(Contract.id.desc())
    )
    details = []
    for contract in result.scalars().all():
        details.append(await _load_detail(db, contract))
    return {"success": True, "data": details}


@router.get("/contracts/{contract_id}", response_model=ContractDetailResponse)
async def get_contract(contract_id: int, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    contract = await _load_contract_or_404(db, contract_id)
    await _ensure_access(contract, current.id)
    return {"success": True, "data": await _load_detail(db, contract)}


@router.post("/contracts/{contract_id}/deliverable", response_model=DeliverableResponse)
async def create_deliverable(contract_id: int, payload: DeliverableCreate, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    contract = await _load_contract_or_404(db, contract_id)
    if contract.freelancer_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the freelancer can upload deliverables")

    milestone_result = await db.execute(
        select(Milestone).where(Milestone.id == payload.milestone_id, Milestone.contract_id == contract.id)
    )
    milestone = milestone_result.scalar_one_or_none()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    deliverable = Deliverable(
        contract_id=contract.id,
        milestone_id=milestone.id,
        file_name=payload.file_name,
        file_url=payload.file_url,
        notes=payload.notes,
        uploaded_by=current.id,
    )
    milestone.completed_bool = True
    milestone.completed_at = datetime.now(timezone.utc)
    db.add(deliverable)
    db.add(milestone)
    await db.commit()
    await db.refresh(deliverable)
    return {"success": True, "data": _serialize_deliverable(deliverable)}


@router.post("/contracts/{contract_id}/milestone/{milestone_id}/approve", response_model=MilestoneApprovalResponse)
async def approve_milestone(contract_id: int, milestone_id: int, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    contract = await _load_contract_or_404(db, contract_id)
    if contract.client_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the client can approve milestones")

    milestone_result = await db.execute(
        select(Milestone).where(Milestone.id == milestone_id, Milestone.contract_id == contract.id)
    )
    milestone = milestone_result.scalar_one_or_none()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    payment_result = await db.execute(
        select(MilestonePayment).where(MilestonePayment.milestone_id == milestone.id, MilestonePayment.contract_id == contract.id)
    )
    payment = payment_result.scalar_one_or_none()
    if not payment:
        commission_amount = round(milestone.amount * 0.10, 2)
        payment = MilestonePayment(
            contract_id=contract.id,
            milestone_id=milestone.id,
            amount=milestone.amount,
            commission_amount=commission_amount,
            freelancer_amount=round(milestone.amount - commission_amount, 2),
            status="pending",
        )
        db.add(payment)
        await db.flush()

    milestone.completed_bool = True
    milestone.approved_bool = True
    milestone.completed_at = milestone.completed_at or datetime.now(timezone.utc)
    milestone.approved_at = datetime.now(timezone.utc)
    payment.status = "paid"
    payment.paid_date = datetime.now(timezone.utc)

    project_result = await db.execute(select(Project).where(Project.id == contract.project_id))
    project = project_result.scalar_one_or_none()
    all_milestones_result = await db.execute(select(Milestone).where(Milestone.contract_id == contract.id))
    all_milestones = all_milestones_result.scalars().all()
    if all_milestones and all(item.approved_bool for item in all_milestones):
        contract.status = "completed"
        contract.completed_at = contract.completed_at or datetime.now(timezone.utc)
        if project:
            project.status = "completed"

    db.add(milestone)
    db.add(payment)
    db.add(contract)
    if project:
        db.add(project)
    await db.commit()

    return {
        "success": True,
        "data": {
            "paid": True,
            "milestone": _serialize_milestone(milestone).model_dump(),
            "payment": _serialize_payment(payment).model_dump(),
            "contract_status": contract.status,
        },
    }


@router.post("/contracts/{contract_id}/review", response_model=ContractDetailResponse)
async def leave_review(contract_id: int, payload: ReviewCreate, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    contract = await _load_contract_or_404(db, contract_id)
    if contract.client_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the client can leave a review")

    existing_result = await db.execute(select(Review).where(Review.contract_id == contract.id))
    review = existing_result.scalar_one_or_none()
    if review:
        review.rating = payload.rating
        review.comment = payload.comment
    else:
        review = Review(
            contract_id=contract.id,
            client_id=current.id,
            freelancer_id=contract.freelancer_id,
            rating=payload.rating,
            comment=payload.comment,
        )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return {"success": True, "data": await _load_detail(db, contract)}


@router.get("/earnings", response_model=EarningsResponse)
async def earnings_summary(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    contracts_result = await db.execute(select(Contract).where(Contract.freelancer_id == current.id))
    contracts = contracts_result.scalars().all()

    payments_result = await db.execute(
        select(MilestonePayment)
        .join(Milestone, Milestone.id == MilestonePayment.milestone_id)
        .where(MilestonePayment.contract_id.in_([contract.id for contract in contracts]))
    )
    payments = payments_result.scalars().all()

    total_earned = sum(payment.freelancer_amount for payment in payments if payment.status == "paid")
    commission_total = sum(payment.commission_amount for payment in payments if payment.status == "paid")
    pending = sum(payment.freelancer_amount for payment in payments if payment.status != "paid")
    paid_milestones = sum(1 for payment in payments if payment.status == "paid")

    data = EarningsOut(
        total_earned=round(total_earned, 2),
        pending=round(pending, 2),
        commission_total=round(commission_total, 2),
        contracts_count=len(contracts),
        paid_milestones=paid_milestones,
    )
    return {"success": True, "data": data}
