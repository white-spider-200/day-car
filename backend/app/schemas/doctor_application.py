import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.core.professional_roles import ProfessionalType
from app.db.models import ApplicationStatus
from app.schemas.doctor_document import DoctorDocumentOut


class ApplicationSaveRequest(BaseModel):
    professional_type: ProfessionalType | None = None
    display_name: str | None = Field(default=None, max_length=255)
    license_number: str | None = Field(default=None, max_length=120)
    license_issuing_authority: str | None = Field(default=None, max_length=255)
    license_expiry_date: date | None = None
    accreditation_body: str | None = Field(default=None, max_length=255)
    legal_prescription_declaration: str | None = None
    no_prescription_declaration: str | None = None
    psychiatrist_prescription_ack: bool | None = None
    therapist_no_prescription_ack: bool | None = None
    headline: str | None = Field(default=None, max_length=255)
    bio: str | None = None
    languages: list[str] | None = None
    specialties: list[str] | None = None
    concerns: list[str] | None = None
    therapy_approaches: list[str] | None = None
    session_types: list[str] | None = None
    gender_identity: str | None = Field(default=None, max_length=40)
    insurance_providers: list[str] | None = None
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
    doctor_user_id: uuid.UUID | None
    status: ApplicationStatus
    display_name: str | None
    full_name: str | None
    email: str | None
    phone: str | None
    photo_url: str | None
    national_id: str | None
    professional_type: ProfessionalType | None
    license_number: str | None
    license_issuing_authority: str | None
    license_expiry_date: date | None
    accreditation_body: str | None
    legal_prescription_declaration: str | None
    no_prescription_declaration: str | None
    psychiatrist_prescription_ack: bool | None
    therapist_no_prescription_ack: bool | None
    headline: str | None
    specialty: str | None
    sub_specialties: list[str] | None
    bio: str | None
    short_bio: str | None
    about: str | None
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
    online_available: bool | None
    years_experience: int | None
    consultation_fee: Decimal | None
    education: list[dict] | None
    licenses: list[dict] | None
    schedule: list[dict] | None
    license_document_url: str | None
    pricing_currency: str
    pricing_per_session: Decimal | None
    pricing_notes: str | None
    submitted_at: datetime | None
    reviewed_at: datetime | None
    rejection_reason: str | None
    admin_note: str | None
    internal_notes: str | None
    verification_status: str | None = None
    documents: list[DoctorDocumentOut] | None = None
    created_at: datetime
    updated_at: datetime


class SubmitApplicationResponse(BaseModel):
    status: ApplicationStatus
    submitted_at: datetime
