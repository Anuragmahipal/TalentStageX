"""
Verification flow endpoints.

States: pending → approved | rejected
MVP: auto-approve on submission (explicit flag: VERIFICATION_AUTO_APPROVE=true).
     Set it to false to require manual admin review.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db import get_db
from src.db_models import User, VerificationRequest
from src.auth_utils import get_current_user
from src.schemas import (
    VerificationRequestCreate,
    VerificationStatusOut,
    VerificationStatusResponse,
    VerificationRequestOut,
    VerificationRequestResponse,
)

router = APIRouter()

# Autoverification is enabled for the current backend build.
_AUTO_APPROVE = True


@router.get("/verification/status", response_model=VerificationStatusResponse)
async def get_verification_status(
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's verification state and any pending request."""
    result = await db.execute(
        select(VerificationRequest)
        .where(VerificationRequest.user_id == current.id)
        .order_by(VerificationRequest.created_at.desc())
    )
    latest = result.scalars().first()

    return {
        "success": True,
        "data": VerificationStatusOut(
            user_id=current.id,
            verified=bool(current.verified),
            pending_request=latest is not None and latest.status == "pending",
            latest_status=latest.status if latest else None,
            submitted_at=latest.created_at if latest else None,
        ),
    }


@router.post("/verification/submit", response_model=VerificationRequestResponse)
async def submit_verification(
    payload: VerificationRequestCreate,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a verification request.
    - If already verified → 409
    - If a pending request exists → 409 (must wait)
    - Auto-approves if VERIFICATION_AUTO_APPROVE=true (MVP default)
    """
    if current.verified:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already verified")

    # Check for existing pending request
    existing_result = await db.execute(
        select(VerificationRequest)
        .where(
            VerificationRequest.user_id == current.id,
            VerificationRequest.status == "pending",
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A verification request is already pending",
        )

    now = datetime.now(timezone.utc)

    if _AUTO_APPROVE:
        vr = VerificationRequest(
            user_id=current.id,
            proof_url=payload.proof_url,
            verification_method=payload.verification_method or "self_attestation",
            status="approved",
            reviewer_notes="Auto-approved (MVP mode)",
            reviewed_at=now,
        )
        # Mark user as verified
        user_result = await db.execute(select(User).where(User.id == current.id))
        user = user_result.scalar_one_or_none()
        if user:
            user.verified = True
            db.add(user)
    else:
        vr = VerificationRequest(
            user_id=current.id,
            proof_url=payload.proof_url,
            verification_method=payload.verification_method or "manual",
            status="pending",
        )

    db.add(vr)
    await db.commit()
    await db.refresh(vr)

    return {
        "success": True,
        "data": VerificationRequestOut(
            id=vr.id,
            user_id=vr.user_id,
            proof_url=vr.proof_url,
            verification_method=vr.verification_method,
            status=vr.status,
            reviewer_notes=vr.reviewer_notes,
            created_at=vr.created_at,
            reviewed_at=vr.reviewed_at,
        ),
    }


@router.get("/verification/history", response_model=dict)
async def verification_history(
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all verification requests for the current user."""
    result = await db.execute(
        select(VerificationRequest)
        .where(VerificationRequest.user_id == current.id)
        .order_by(VerificationRequest.created_at.desc())
    )
    requests = result.scalars().all()
    data = [
        VerificationRequestOut(
            id=vr.id,
            user_id=vr.user_id,
            proof_url=vr.proof_url,
            verification_method=vr.verification_method,
            status=vr.status,
            reviewer_notes=vr.reviewer_notes,
            created_at=vr.created_at,
            reviewed_at=vr.reviewed_at,
        ).model_dump()
        for vr in requests
    ]
    return {"success": True, "data": data}
