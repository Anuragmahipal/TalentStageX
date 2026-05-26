import os

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from src.db import init_db

from src.routers import auth
from src.routers import contracts
from src.routers import profile
from src.routers import projects
from src.routers import skills

app = FastAPI(title="TalentStageX API")

frontend_origins = [origin.strip() for origin in os.getenv(
    "TS_FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
).split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profile.router, prefix="", tags=["profile"])
app.include_router(projects.router, prefix="", tags=["projects"])
app.include_router(skills.router, prefix="", tags=["skills"])
app.include_router(contracts.router, prefix="", tags=["contracts"])


def _redirect_for_status(status_code: int) -> str | None:
    if status_code in (401, 403):
        return "/auth/login"
    return None


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.detail,
                "code": exc.status_code,
                "redirect_to": _redirect_for_status(exc.status_code),
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "message": "Validation error",
                "code": 422,
                "redirect_to": None,
                "fields": exc.errors(),
            },
        },
    )

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
async def root():
    return {"service": "TalentStageX API", "docs": "/docs", "health": "/api/health"}


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "TalentStageX API"}
