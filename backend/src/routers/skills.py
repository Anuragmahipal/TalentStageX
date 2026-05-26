from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.auth_utils import get_current_user
from src.db import get_db
from src.db_models import SkillBadge, SkillTestAttempt
from src.schemas import (
    SkillsSummaryResponse,
    SkillsSummaryOut,
    SkillBadgeOut,
    SkillBadgeListResponse,
    SkillTestGenerateRequest,
    SkillTestGenerateResponse,
    SkillQuestionOut,
    SkillTestSubmitRequest,
    SkillTestSubmitResponse,
)
from src.utils.ai_placeholders import generate_skill_test_placeholder

router = APIRouter()


def _serialize_badge(badge: SkillBadge) -> SkillBadgeOut:
    return SkillBadgeOut(
        id=badge.id,
        user_id=badge.user_id,
        skill_name=badge.skill_name,
        label=badge.label,
        awarded_at=badge.awarded_at,
    )


@router.get("/skills", response_model=SkillsSummaryResponse)
async def skills_summary(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    badge_result = await db.execute(select(SkillBadge).where(SkillBadge.user_id == current.id).order_by(SkillBadge.id.desc()))
    attempt_result = await db.execute(select(SkillTestAttempt).where(SkillTestAttempt.user_id == current.id).order_by(SkillTestAttempt.id.desc()))
    attempts = []
    for attempt in attempt_result.scalars().all():
        attempts.append(
            {
                "id": attempt.id,
                "user_id": attempt.user_id,
                "skill_name": attempt.skill_name,
                "score": attempt.score,
                "passed": attempt.passed,
                "badge_name": attempt.badge_name,
                "created_at": attempt.created_at,
            }
        )
    data = SkillsSummaryOut(
        badges=[_serialize_badge(badge) for badge in badge_result.scalars().all()],
        attempts=attempts,
    )
    return {"success": True, "data": data}


@router.get("/skills/badges", response_model=SkillBadgeListResponse)
async def list_badges(current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    badge_result = await db.execute(select(SkillBadge).where(SkillBadge.user_id == current.id).order_by(SkillBadge.id.desc()))
    badges = [_serialize_badge(badge) for badge in badge_result.scalars().all()]
    return {"success": True, "data": badges}


@router.post("/skills/test/generate", response_model=SkillTestGenerateResponse)
async def generate_skill_test(payload: SkillTestGenerateRequest, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    questions = generate_skill_test_placeholder(payload.skill_name)
    attempt = SkillTestAttempt(
        user_id=current.id,
        skill_name=payload.skill_name,
        questions_json=json.dumps(questions),
        answers_json=json.dumps([]),
        score=0,
        passed=False,
        badge_name=None,
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    return {
        "success": True,
        "data": {
            "test_id": attempt.id,
            "skill_name": payload.skill_name,
            "questions": [
                SkillQuestionOut(question=item["question"], options=item["options"]).model_dump()
                for item in questions
            ],
        },
    }


@router.post("/skills/test/submit", response_model=SkillTestSubmitResponse)
async def submit_skill_test(payload: SkillTestSubmitRequest, current=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SkillTestAttempt).where(SkillTestAttempt.id == payload.test_id))
    attempt = result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill test not found")
    if attempt.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to submit this skill test")

    questions = json.loads(attempt.questions_json or "[]")
    correct_answers = [item.get("correct_answer") for item in questions]
    submitted_answers = payload.answers[: len(correct_answers)]
    score_count = 0
    for submitted, correct in zip(submitted_answers, correct_answers):
        if str(submitted).strip().lower() == str(correct).strip().lower():
            score_count += 1

    total_questions = max(len(correct_answers), 1)
    score = int(round((score_count / total_questions) * 100))
    passed = score >= 70
    badge_name = f"Verified {attempt.skill_name.title()}" if passed else None

    attempt.answers_json = json.dumps(payload.answers)
    attempt.score = score
    attempt.passed = passed
    attempt.badge_name = badge_name
    db.add(attempt)

    badge = None
    if passed:
        badge_result = await db.execute(
            select(SkillBadge).where(SkillBadge.user_id == current.id, SkillBadge.skill_name == attempt.skill_name)
        )
        badge = badge_result.scalar_one_or_none()
        if not badge:
            badge = SkillBadge(
                user_id=current.id,
                skill_name=attempt.skill_name,
                label=badge_name,
                source_attempt_id=attempt.id,
            )
            db.add(badge)

    await db.commit()

    return {
        "success": True,
        "data": {
            "test_id": attempt.id,
            "skill_name": attempt.skill_name,
            "score": score,
            "passed": passed,
            "badge": badge_name,
            "badge_id": badge.id if badge else None,
        },
    }
