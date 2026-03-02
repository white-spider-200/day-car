import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class ProfileUpdateStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DoctorProfileUpdateRequest(Base, TimestampMixin):
    __tablename__ = "doctor_profile_update_requests"
    __table_args__ = (
        Index("ix_doctor_profile_update_requests_doctor_user_id", "doctor_user_id"),
        Index("ix_doctor_profile_update_requests_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    payload_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[ProfileUpdateStatus] = mapped_column(
        Enum(ProfileUpdateStatus, name="profile_update_status", native_enum=True),
        nullable=False,
        default=ProfileUpdateStatus.PENDING,
        server_default=ProfileUpdateStatus.PENDING.value,
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewer_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
