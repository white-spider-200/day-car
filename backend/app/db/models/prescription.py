import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class PrescriptionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


class Prescription(Base, TimestampMixin):
    __tablename__ = "prescriptions"
    __table_args__ = (
        Index("ix_prescriptions_doctor_user_id", "doctor_user_id"),
        Index("ix_prescriptions_user_id", "user_id"),
        Index("ix_prescriptions_verification_code", "verification_code", unique=True),
        Index("ix_prescriptions_issued_at", "issued_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    medication_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(255), nullable=False)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[str] = mapped_column(String(120), nullable=False)

    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    verification_code: Mapped[str] = mapped_column(String(80), nullable=False)
    data_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    pdf_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    status: Mapped[PrescriptionStatus] = mapped_column(
        Enum(PrescriptionStatus, name="prescription_status", native_enum=True),
        nullable=False,
        default=PrescriptionStatus.ACTIVE,
        server_default=PrescriptionStatus.ACTIVE.value,
    )

