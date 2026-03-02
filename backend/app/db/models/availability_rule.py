import uuid
from datetime import date, datetime
from datetime import time

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, String, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DoctorAvailabilityRule(Base):
    __tablename__ = "doctor_availability_rules"
    __table_args__ = (Index("ix_doctor_availability_rules_doctor_user_id", "doctor_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(nullable=False)
    start_time: Mapped[time] = mapped_column(Time(timezone=False), nullable=False)
    end_time: Mapped[time] = mapped_column(Time(timezone=False), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Amman", server_default="Asia/Amman")
    slot_duration_minutes: Mapped[int] = mapped_column(nullable=False, default=50, server_default="50")
    buffer_minutes: Mapped[int] = mapped_column(nullable=False, default=10, server_default="10")
    is_blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    effective_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
