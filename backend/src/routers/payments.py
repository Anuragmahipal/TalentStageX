from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.auth_utils import get_current_user
from src.db import get_db
from src.db_models import Contract, Milestone, MilestonePayment, StripeCheckoutSession
from src.schemas import (
    PaymentSessionCreate,
    PaymentSessionConfirmRequest,
    PaymentSessionOut,
    PaymentSessionResponse,
    PaymentSessionListResponse,
)

router = APIRouter()


def _serialize_session(session: StripeCheckoutSession) -> PaymentSessionOut:
    return PaymentSessionOut(
        id=session.id,
        session_id=session.session_id,
        user_id=session.user_id,
        contract_id=session.contract_id,
        milestone_id=session.milestone_id,
        amount=session.amount,
        currency=session.currency,
        status=session.status,
        checkout_url=session.checkout_url,
        created_at=session.created_at,
        completed_at=session.completed_at,
    )


async def _load_contract_for_user(db: AsyncSession, contract_id: int, user_id: int) -> Contract:
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    if contract.client_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to fund this contract")
    return contract


async def _load_milestone_for_contract(db: AsyncSession, contract_id: int, milestone_id: int) -> Milestone:
    result = await db.execute(
        select(Milestone).where(Milestone.id == milestone_id, Milestone.contract_id == contract_id)
    )
    milestone = result.scalar_one_or_none()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    return milestone


@router.get("/payments/stripe/sessions", response_model=PaymentSessionListResponse)
async def list_payment_sessions(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StripeCheckoutSession)
        .where(StripeCheckoutSession.user_id == current.id)
        .order_by(StripeCheckoutSession.id.desc())
    )
    sessions = [_serialize_session(item) for item in result.scalars().all()]
    return {"success": True, "data": sessions}


@router.post("/payments/stripe/session", response_model=PaymentSessionResponse)
async def create_payment_session(
    payload: PaymentSessionCreate,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    contract = None
    milestone = None

    if payload.contract_id is not None:
        contract = await _load_contract_for_user(db, payload.contract_id, current.id)

    if payload.milestone_id is not None:
        if not contract:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="contract_id is required for milestone payments")
        milestone = await _load_milestone_for_contract(db, contract.id, payload.milestone_id)

    if payload.amount is not None:
        amount = payload.amount
    elif milestone is not None:
        amount = milestone.amount
    elif contract is not None:
        amount = contract.total_amount
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="amount is required when no contract is provided")

    session_id = f"cs_test_{secrets.token_urlsafe(16)}"
    checkout_url = f"https://checkout.stripe.com/pay/{session_id}"

    session = StripeCheckoutSession(
        session_id=session_id,
        user_id=current.id,
        contract_id=contract.id if contract else None,
        milestone_id=milestone.id if milestone else None,
        amount=amount,
        currency=payload.currency.lower(),
        status="created",
        checkout_url=checkout_url,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {"success": True, "data": _serialize_session(session)}


@router.post("/payments/stripe/confirm", response_model=PaymentSessionResponse)
async def confirm_payment_session(
    payload: PaymentSessionConfirmRequest,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StripeCheckoutSession).where(
            StripeCheckoutSession.session_id == payload.session_id,
            StripeCheckoutSession.user_id == current.id,
        )
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment session not found")

    if session.status == "completed":
        return {"success": True, "data": _serialize_session(session)}

    if session.contract_id is not None and session.milestone_id is not None:
        contract = await _load_contract_for_user(db, session.contract_id, current.id)
        payment_result = await db.execute(
            select(MilestonePayment).where(
                MilestonePayment.contract_id == contract.id,
                MilestonePayment.milestone_id == session.milestone_id,
            )
        )
        payment = payment_result.scalar_one_or_none()
        if not payment:
            milestone_result = await db.execute(
                select(Milestone).where(Milestone.id == session.milestone_id, Milestone.contract_id == contract.id)
            )
            milestone = milestone_result.scalar_one_or_none()
            if not milestone:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
            commission_amount = round(session.amount * 0.10, 2)
            payment = MilestonePayment(
                contract_id=contract.id,
                milestone_id=milestone.id,
                amount=session.amount,
                commission_amount=commission_amount,
                freelancer_amount=round(session.amount - commission_amount, 2),
                status="pending",
            )
            db.add(payment)
            await db.flush()

        payment.status = "paid"
        payment.paid_date = datetime.now(timezone.utc)
        db.add(payment)

    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)

    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {"success": True, "data": _serialize_session(session)}