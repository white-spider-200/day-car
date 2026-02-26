import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import ApplicationStatus


class ApplicationSaveRequest(BaseModel):
    display_name: str | None = Field(default=None, max_length=255)
    headline: str | None = Field(default=None, max_length=255)
    bio: str | None = None
    languages: list[str] | None = None
    specialties: list[str] | None = None
    session_types: list[str] | None = None
    location_country: str | None = Field(default=None, max_length=120)
    location_city: str | None = Field(default=None, max_length=120)
    years_experience: int | None = Field(default=None, ge=0, le=80)
    education: list[dict] | None = None
    licenses: list[dict] | None = None
    pricing_currency: str | None = Field(default=None, max_length=10)
    pricing_per_session: Decimal | None = Field(default=None, ge=0)
    pricing_notes: str | None = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    doctor_user_id: uuid.UUID
    status: ApplicationStatus
    display_name: str | None
    headline: str | None
    bio: str | None
    languages: list[str] | None
    specialties: list[str] | None
    session_types: list[str] | None
    location_country: str | None
    location_city: str | None
    years_experience: int | None
    education: list[dict] | None
    licenses: list[dict] | None
    pricing_currency: str
    pricing_per_session: Decimal | None
    pricing_notes: str | None
    submitted_at: datetime | None
    reviewed_at: datetime | None
    rejection_reason: str | None
    internal_notes: str | None
    created_at: datetime
    updated_at: datetime


class SubmitApplicationResponse(BaseModel):
    status: ApplicationStatus
    submitted_at: datetime
