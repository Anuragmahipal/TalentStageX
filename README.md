# TalentStageX

TalentStageX is a modern freelance marketplace backend designed for fast, credible matching between clients and freelancers. The system delivers a complete project lifecycle: secure authentication, rich profile and portfolio management, project posting and proposals, contract workflows, milestone approvals, reviews, and skills verification. It is built for rapid iteration in a hackathon setting, but structured like a production-ready service.

## Highlights

- Secure cookie-based auth with short-lived access tokens and refresh support
- Profile and portfolio management with profile completeness scoring
- Project posting, open project discovery, and proposal workflows
- Proposal evaluation and hire flow leading to contract creation
- Contract lifecycle endpoints: deliverables, milestone approvals, reviews
- Skills tests, attempts, and badges for verification
- Consistent API envelopes and validation errors
- Deterministic placeholder logic for AI-driven scoring and tests

## Tech Stack

- FastAPI (Python)
- PostgreSQL (async SQLAlchemy + asyncpg)
- Pydantic v2 validation
- JWT auth with `httpOnly` cookies
- Docker Compose for local database

## Quick Start

Run everything from the `backend/` directory.

```bash
cd backend
docker compose up -d
uv run python -m scripts.seed
uv run uvicorn src.main:app --reload
```

The API runs at `http://localhost:8000`.

## Demo Accounts

The seed script creates demo users:

- Freelancer: `test.freelancer@example.com`
- Client: `test.client@example.com`
- Password: `password`

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `TS_SECRET` - JWT signing secret
- `TS_FRONTEND_ORIGINS` - comma-separated CORS origins

If `DATABASE_URL` is not set, the backend defaults to PostgreSQL on `localhost:5432`.

## Core API Routes

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Profile and Portfolio

- `GET /profile`
- `PUT /profile`
- `GET /profile/completeness`
- `GET /portfolio`
- `POST /portfolio`
- `PUT /portfolio/{portfolio_id}`
- `DELETE /portfolio/{portfolio_id}`
- `POST /user/{user_id}/verify`

### Projects and Proposals

- `GET /projects`
- `GET /projects/open`
- `POST /projects`
- `GET /projects/{project_id}`
- `POST /projects/{project_id}/proposal`
- `GET /projects/{project_id}/proposals`
- `POST /projects/{project_id}/evaluate`
- `POST /projects/{project_id}/hire`

### Contracts

- `POST /contracts`
- `GET /contracts`
- `GET /contracts/{contract_id}`
- `POST /contracts/{contract_id}/deliverable`
- `POST /contracts/{contract_id}/milestone/{milestone_id}/approve`
- `POST /contracts/{contract_id}/review`
- `GET /earnings`

### Skills

- `POST /skills/test/generate`
- `POST /skills/test/submit`
- `GET /skills/badges`
- `GET /skills/attempts`

## Quick Verification

```bash
curl -i http://localhost:8000/api/health
curl -i -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"test.freelancer@example.com","password":"password"}' \
  http://localhost:8000/auth/login
curl -i -b cookies.txt http://localhost:8000/auth/me
curl -i -b cookies.txt http://localhost:8000/projects/open
```

## Project Vision

TalentStageX elevates the freelancer hiring experience by pairing strong identity, portfolio, and skill verification with a streamlined contracting flow. The backend is structured to support AI-assisted matching and scoring while remaining stable and deterministic today. This gives teams a reliable foundation that can scale into deeper marketplace intelligence without reworking the core architecture.