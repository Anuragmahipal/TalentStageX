from datetime import datetime
from typing import Optional, Any, Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "freelancer"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    verified: bool = False

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ApiSuccess(BaseModel):
    success: bool = True
    message: Optional[str] = None


class ApiErrorDetail(BaseModel):
    message: str
    code: int
    redirect_to: Optional[str] = None
    fields: Optional[Any] = None


class ApiError(BaseModel):
    success: bool = False
    error: ApiErrorDetail


class AuthData(BaseModel):
    user: UserOut
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthResponse(ApiSuccess):
    data: AuthData


class UserResponse(ApiSuccess):
    data: UserOut


class ProfileUpdate(BaseModel):
    title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    photo_url: Optional[str] = None
    skills: Optional[list[str]] = None
    portfolio_items: Optional[list[dict[str, Any]]] = None


class PortfolioItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tools: list[str] = Field(default_factory=list)
    media_url: Optional[str] = None
    link: Optional[str] = None


class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tools: Optional[list[str]] = None
    media_url: Optional[str] = None
    link: Optional[str] = None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    user_id: int
    title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    photo_url: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    portfolio_items: list[dict[str, Any]] = Field(default_factory=list)
    rating: Optional[float] = None
    total_earnings: float = 0.0
    verified: bool = False
    completeness_pct: int = 0
    completeness_breakdown: Optional[dict] = None


class PortfolioItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    tools: list[str] = Field(default_factory=list)
    media_url: Optional[str] = None
    link: Optional[str] = None
    created_at: Optional[datetime] = None


class PortfolioListResponse(ApiSuccess):
    data: list[PortfolioItemOut]


class SkillBadgeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    skill_name: str
    label: str
    awarded_at: Optional[datetime] = None


class SkillBadgeListResponse(ApiSuccess):
    data: list[SkillBadgeOut]


class SkillQuestionOut(BaseModel):
    question: str
    options: list[str] = Field(default_factory=list)


class SkillTestGenerateRequest(BaseModel):
    skill_name: str


class SkillTestGenerateResponse(ApiSuccess):
    data: dict[str, Any]


class SkillTestSubmitRequest(BaseModel):
    test_id: int
    answers: list[str]


class SkillTestSubmitResponse(ApiSuccess):
    data: dict[str, Any]


class VerificationRequestCreate(BaseModel):
    proof_url: Optional[str] = None
    verification_method: Optional[str] = None


class VerificationResponse(ApiSuccess):
    data: UserOut


class ProjectCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    description: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    deadline: Optional[datetime] = None
    project_type: Literal["fixed", "hourly"] = Field(default="fixed", alias="type")


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    client_id: int
    title: str
    description: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    deadline: Optional[datetime] = None
    project_type: Literal["fixed", "hourly"] = Field(default="fixed", alias="type")
    status: str


class ProposalCreate(BaseModel):
    amount: float
    duration_days: int
    cover_message: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("amount must be greater than 0")
        return value

    @field_validator("duration_days")
    @classmethod
    def validate_duration(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("duration_days must be greater than 0")
        return value

    @field_validator("cover_message")
    @classmethod
    def validate_cover_message(cls, value: str) -> str:
        if len(value.strip()) < 10:
            raise ValueError("cover_message must be at least 10 characters")
        return value


class ProposalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    proposal_id: int
    score: int
    status: str


class ProposalCreateResponse(ApiSuccess):
    data: ProposalOut


class ProposalItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    proposal_id: int
    project_id: int
    freelancer_id: int
    freelancer: UserOut
    freelancer_name: str
    amount: Optional[float] = None
    duration_days: Optional[int] = None
    cover_message: Optional[str] = None
    score: int = 0
    status: str = "submitted"


class ProposalScoreOut(BaseModel):
    proposal_id: int
    score: int
    label: str = "evaluated"


class ContractOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    proposal_id: int
    client_id: int
    freelancer_id: int
    total_amount: float
    status: str
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    contract_id: int
    description: str
    amount: float
    due_date: Optional[datetime] = None
    completed_bool: bool = False
    approved_bool: bool = False
    completed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None


class MilestonePaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contract_id: int
    milestone_id: int
    amount: float
    commission_amount: float
    freelancer_amount: float
    status: str
    paid_date: Optional[datetime] = None


class DeliverableOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contract_id: int
    milestone_id: int
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    notes: Optional[str] = None
    uploaded_by: int
    created_at: Optional[datetime] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contract_id: int
    client_id: int
    freelancer_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None


class ContractDetailOut(BaseModel):
    contract: ContractOut
    milestones: list[MilestoneOut] = Field(default_factory=list)
    payments: list[MilestonePaymentOut] = Field(default_factory=list)
    deliverables: list[DeliverableOut] = Field(default_factory=list)
    review: Optional[ReviewOut] = None


class ContractDetailResponse(ApiSuccess):
    data: ContractDetailOut


class ContractListResponse(ApiSuccess):
    data: list[ContractDetailOut]


class HireRequest(BaseModel):
    proposal_id: int


class DeliverableCreate(BaseModel):
    milestone_id: int
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    notes: Optional[str] = None


class DeliverableResponse(ApiSuccess):
    data: DeliverableOut


class MilestoneApprovalResponse(ApiSuccess):
    data: dict[str, Any]


class PaymentSessionCreate(BaseModel):
    contract_id: Optional[int] = None
    milestone_id: Optional[int] = None
    amount: Optional[float] = None
    currency: str = "usd"


class PaymentSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    user_id: int
    contract_id: Optional[int] = None
    milestone_id: Optional[int] = None
    amount: float
    currency: str
    status: str
    checkout_url: str
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class PaymentSessionResponse(ApiSuccess):
    data: PaymentSessionOut


class PaymentSessionListResponse(ApiSuccess):
    data: list[PaymentSessionOut]


class PaymentSessionConfirmRequest(BaseModel):
    session_id: str


class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, value: int) -> int:
        if value < 1 or value > 5:
            raise ValueError("rating must be between 1 and 5")
        return value


class EarningsOut(BaseModel):
    total_earned: float = 0.0
    pending: float = 0.0
    commission_total: float = 0.0
    contracts_count: int = 0
    paid_milestones: int = 0


class EarningsResponse(ApiSuccess):
    data: EarningsOut


class ProfileResponse(ApiSuccess):
    data: ProfileOut


class ProjectListResponse(ApiSuccess):
    data: list[ProjectOut]


class ProjectResponse(ApiSuccess):
    data: ProjectOut


class ProposalResponse(ApiSuccess):
    data: ProposalOut


class ProposalListResponse(ApiSuccess):
    data: list[ProposalItemOut]


class ContractResponse(ApiSuccess):
    data: ContractOut


class ProfileCompletenessOut(BaseModel):
    percent: int
    completeness_pct: int
    completeness_breakdown: dict[str, int]


class ProfileCompletenessResponse(ApiSuccess):
    data: ProfileCompletenessOut


class ProposalEvaluationResponse(ApiSuccess):
    data: list[ProposalScoreOut]


class SkillsSummaryOut(BaseModel):
    badges: list[SkillBadgeOut] = Field(default_factory=list)
    attempts: list[dict[str, Any]] = Field(default_factory=list)


class SkillsSummaryResponse(ApiSuccess):
    data: SkillsSummaryOut


# ─── Saved Freelancers ────────────────────────────────────────────────────────

class SavedFreelancerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    freelancer_id: int
    freelancer_name: str
    freelancer_title: Optional[str] = None
    freelancer_hourly_rate: Optional[float] = None
    freelancer_skills: list[str] = Field(default_factory=list)
    freelancer_verified: bool = False
    created_at: Optional[datetime] = None


class SavedFreelancerListResponse(ApiSuccess):
    data: list[SavedFreelancerOut]


class SavedToggleResponse(ApiSuccess):
    data: dict


# ─── AI Matching ──────────────────────────────────────────────────────────────

class FreelancerMatchOut(BaseModel):
    freelancer_id: int
    name: str
    title: Optional[str] = None
    hourly_rate: Optional[float] = None
    skills: list[str] = Field(default_factory=list)
    verified: bool = False
    match_score: int
    match_reason: str
    portfolio_count: int = 0
    avg_rating: Optional[float] = None


class MatchRequest(BaseModel):
    project_id: int


class MatchResponse(ApiSuccess):
    data: list[FreelancerMatchOut]


# ─── AI Brief Generation ──────────────────────────────────────────────────────

class BriefGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=2000)


class GeneratedBrief(BaseModel):
    title: str
    description: str
    skills: list[str]
    budget_min: int
    budget_max: int
    timeline_days: int
    next_step: str


class BriefGenerateResponse(ApiSuccess):
    data: GeneratedBrief


# ─── Verification (enhanced) ─────────────────────────────────────────────────

class VerificationStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    verified: bool
    pending_request: bool = False
    latest_status: Optional[str] = None  # approved / pending / rejected
    submitted_at: Optional[datetime] = None


class VerificationStatusResponse(ApiSuccess):
    data: VerificationStatusOut


class VerificationRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    proof_url: Optional[str] = None
    verification_method: Optional[str] = None
    status: str
    reviewer_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None


class VerificationRequestResponse(ApiSuccess):
    data: VerificationRequestOut
