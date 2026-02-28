import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class ApplicationStatus(str, enum.Enum):
    PENDING = "PENDING"
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEEDS_CHANGES = "NEEDS_CHANGES"


class DoctorApplication(Base, TimestampMixin):
    __tablename__ = "doctor_applications"
    __table_args__ = (
        Index("ix_doctor_applications_doctor_user_id", "doctor_user_id", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status", native_enum=True),
        nullable=False,
        default=ApplicationStatus.DRAFT,
        server_default=ApplicationStatus.DRAFT.value,
    )
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    national_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    headline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sub_specialties: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    about: Mapped[str | None] = mapped_column(Text, nullable=True)
    languages: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    specialties: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    concerns: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    therapy_approaches: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    session_types: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    gender_identity: Mapped[str | None] = mapped_column(String(40), nullable=True)
    insurance_providers: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    location_country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location_city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    online_available: Mapped[bool | None] = mapped_column(nullable=True)
    years_experience: Mapped[int | None] = mapped_column(nullable=True)
    consultation_fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    education: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    licenses: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    schedule: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    license_document_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    pricing_currency: Mapped[str] = mapped_column(String(10), nullable=False, default="JOD", server_default="JOD")
    pricing_per_session: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    pricing_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewer_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
