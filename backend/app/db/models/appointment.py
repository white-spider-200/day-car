import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AppointmentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        Index("ix_appointments_doctor_user_id", "doctor_user_id"),
        Index("ix_appointments_user_id", "user_id"),
        Index("ix_appointments_start_at", "start_at"),
        Index("ix_appointments_doctor_range", "doctor_user_id", "start_at", "end_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, name="appointment_status", native_enum=True),
        nullable=False,
        default=AppointmentStatus.REQUESTED,
        server_default=AppointmentStatus.REQUESTED.value,
    )
    meeting_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
