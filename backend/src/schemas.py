from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "freelancer"

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileIn(BaseModel):
    title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None


class ProfileOut(BaseModel):
    id: int | None = None
    user_id: int
    title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    completeness_pct: int = 0
    completeness_breakdown: Optional[dict] = None
