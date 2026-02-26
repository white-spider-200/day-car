import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class DoctorProfile(Base, TimestampMixin):
    __tablename__ = "doctor_profiles"
    __table_args__ = (Index("ix_doctor_profiles_doctor_user_id", "doctor_user_id", unique=True),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    languages: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    specialties: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    session_types: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    location_country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location_city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    years_experience: Mapped[int | None] = mapped_column(nullable=True)
    education: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    licenses_public: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    pricing_currency: Mapped[str] = mapped_column(String(10), nullable=False, default="JOD", server_default="JOD")
    pricing_per_session: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    pricing_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    verification_badges: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
