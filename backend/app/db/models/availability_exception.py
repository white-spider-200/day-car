import uuid
from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, String, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DoctorAvailabilityException(Base):
    __tablename__ = "doctor_availability_exceptions"
    __table_args__ = (Index("ix_doctor_availability_exceptions_doctor_user_id", "doctor_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    is_unavailable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    start_time: Mapped[time | None] = mapped_column(Time(timezone=False), nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time(timezone=False), nullable=True)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
