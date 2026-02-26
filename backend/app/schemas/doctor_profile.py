import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DoctorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    doctor_user_id: uuid.UUID
    display_name: str
    headline: str | None
    bio: str | None
    photo_url: str | None
    languages: list[str] | None
    specialties: list[str] | None
    session_types: list[str] | None
    location_country: str | None
    location_city: str | None
    years_experience: int | None
    education: list[dict] | None
    licenses_public: list[dict] | None
    pricing_currency: str
    pricing_per_session: Decimal | None
    pricing_notes: str | None
    verification_badges: list[str] | None
    is_public: bool
    published_at: datetime | None


class DoctorProfileListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    doctor_user_id: uuid.UUID
    display_name: str
    headline: str | None
    photo_url: str | None
    specialties: list[str] | None
    languages: list[str] | None
    session_types: list[str] | None
    location_city: str | None
    location_country: str | None
    pricing_currency: str
    pricing_per_session: Decimal | None
    verification_badges: list[str] | None
