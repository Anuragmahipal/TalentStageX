"""Seed script to populate dev data for TalentStageX.
Run with: python -m backend.scripts.seed (from repo root) or `python backend/scripts/seed.py`
"""
import asyncio
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from src.db import engine, AsyncSessionLocal, init_db
from src.db_models import User, Profile, Project, Proposal, PortfolioItem


async def run():
    await init_db()
    async with AsyncSessionLocal() as db:
        # ensure idempotent: check users by email
        from sqlalchemy import select

        async def get_user(email: str):
            res = await db.execute(select(User).where(User.email == email))
            return res.scalar_one_or_none()

        freelancer_email = "test.freelancer@example.com"
        client_email = "test.client@example.com"

        u1 = await get_user(freelancer_email)
        if not u1:
            from src.auth_utils import get_password_hash
            u1 = User(name="Test Freelancer", email=freelancer_email, password_hash=get_password_hash("password"), role="freelancer")
            db.add(u1)
            await db.commit()
            await db.refresh(u1)
        else:
            # ensure password is hashed with our current scheme (re-hash if missing or not pbkdf2)
            if not u1.password_hash or not str(u1.password_hash).startswith("$pbkdf2-sha256$"):
                from src.auth_utils import get_password_hash
                u1.password_hash = get_password_hash("password")
                db.add(u1)
                await db.commit()

        u2 = await get_user(client_email)
        if not u2:
            from src.auth_utils import get_password_hash
            u2 = User(name="Test Client", email=client_email, password_hash=get_password_hash("password"), role="client")
            db.add(u2)
            await db.commit()
            await db.refresh(u2)
        else:
            if not u2.password_hash or not str(u2.password_hash).startswith("$pbkdf2-sha256$"):
                from src.auth_utils import get_password_hash
                u2.password_hash = get_password_hash("password")
                db.add(u2)
                await db.commit()

        # profile for freelancer
        res = await db.execute(select(Profile).where(Profile.user_id == u1.id))
        prof = res.scalar_one_or_none()
        if not prof:
            p1 = Profile(
                user_id=u1.id,
                title="Frontend Engineer",
                bio="React/Next.js specialist",
                hourly_rate=50,
                photo_url="https://example.com/avatar.png",
                skills='["React", "Next.js", "TypeScript"]',
                portfolio_items='[{"title": "Landing page", "link": "https://example.com"}]',
            )
            db.add(p1)
            await db.commit()
        else:
            prof.title = prof.title or "Frontend Engineer"
            prof.bio = prof.bio or "React/Next.js specialist"
            prof.hourly_rate = prof.hourly_rate or 50
            prof.photo_url = prof.photo_url or "https://example.com/avatar.png"
            prof.skills = prof.skills or '["React", "Next.js", "TypeScript"]'
            prof.portfolio_items = prof.portfolio_items or '[{"title": "Landing page", "link": "https://example.com"}]'
            db.add(prof)
            await db.commit()

        res = await db.execute(select(PortfolioItem).where(PortfolioItem.user_id == u1.id))
        portfolio_item = res.scalar_one_or_none()
        if not portfolio_item:
            portfolio_item = PortfolioItem(
                user_id=u1.id,
                title="Landing page refresh",
                description="Modernized a marketing landing page for a SaaS startup.",
                tools='["Next.js", "Tailwind", "TypeScript"]',
                media_url="https://example.com/portfolio.png",
                link="https://example.com/case-study",
            )
            db.add(portfolio_item)
            await db.commit()

        # create a sample project if none exists for client
        res = await db.execute(select(Project).where(Project.client_id == u2.id))
        project = res.scalar_one_or_none()
        if not project:
            project = Project(
                client_id=u2.id,
                title="Landing page refresh",
                description="Modernize landing page using Next.js",
                skills='["Next.js", "React", "Tailwind"]',
                budget_min=500,
                budget_max=1500,
                deadline=datetime.now(timezone.utc) + timedelta(days=14),
                project_type="fixed",
            )
            db.add(project)
            await db.commit()
            await db.refresh(project)

        # create a proposal if none exists
        res = await db.execute(select(Proposal).where(Proposal.project_id == project.id).where(Proposal.freelancer_id == u1.id))
        prop = res.scalar_one_or_none()
        if not prop:
            prop = Proposal(project_id=project.id, freelancer_id=u1.id, amount=800, duration_days=7, cover_message="I can deliver a polished landing page.", score=88)
            db.add(prop)
            await db.commit()

        print("Seed complete: test freelancer and client created. Login with email/password: password")


if __name__ == "__main__":
    asyncio.run(run())
