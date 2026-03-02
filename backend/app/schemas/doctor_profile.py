import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DoctorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    doctor_user_id: uuid.UUID
    slug: str
    display_name: str
    headline: str | None
    bio: str | None
    approach_text: str | None
    photo_url: str | None
    languages: list[str] | None
    specialties: list[str] | None
    concerns: list[str] | None
    therapy_approaches: list[str] | None
    session_types: list[str] | None
    gender_identity: str | None
    insurance_providers: list[str] | None
    location_country: str | None
    location_city: str | None
    clinic_name: str | None
    address_line: str | None
    map_url: str | None
    next_available_at: datetime | None
    availability_timezone: str | None
    availability_preview_slots: list[str] | None
    years_experience: int | None
    rating: Decimal | None
    reviews_count: int
    education: list[str] | list[dict] | None
    certifications: list[str] | None
    licenses_public: list[dict] | None
    pricing_currency: str
    pricing_per_session: Decimal | None
    follow_up_price: Decimal | None
    pricing_notes: str | None
    verification_badges: list[str] | None
    is_top_doctor: bool
    is_public: bool
    published_at: datetime | None


class DoctorProfileListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    doctor_user_id: uuid.UUID
    slug: str
    display_name: str
    headline: str | None
    photo_url: str | None
    specialties: list[str] | None
    languages: list[str] | None
    concerns: list[str] | None
    therapy_approaches: list[str] | None
    session_types: list[str] | None
    gender_identity: str | None
    insurance_providers: list[str] | None
    location_city: str | None
    location_country: str | None
    clinic_name: str | None
    address_line: str | None
    next_available_at: datetime | None
    rating: Decimal | None
    reviews_count: int
    pricing_currency: str
    pricing_per_session: Decimal | None
    follow_up_price: Decimal | None
    verification_badges: list[str] | None
    is_top_doctor: bool
