from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.db import init_db

from src.routers import auth
from src.routers import profile
from src.routers import projects

app = FastAPI(title="TalentStageX API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profile.router, prefix="", tags=["profile"])
app.include_router(projects.router, prefix="", tags=["projects"])

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
def root():
    return {"status": "ok", "service": "TalentStageX API"}
