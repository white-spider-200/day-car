import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class TreatmentRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"


class TreatmentRequest(Base, TimestampMixin):
    __tablename__ = "treatment_requests"
    __table_args__ = (
        Index("ix_treatment_requests_doctor_id", "doctor_id"),
        Index("ix_treatment_requests_user_id", "user_id"),
        Index("ix_treatment_requests_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[TreatmentRequestStatus] = mapped_column(
        Enum(TreatmentRequestStatus, name="treatment_request_status", native_enum=True),
        nullable=False,
        default=TreatmentRequestStatus.PENDING,
        server_default=TreatmentRequestStatus.PENDING.value,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    doctor_note: Mapped[str | None] = mapped_column(Text, nullable=True)
