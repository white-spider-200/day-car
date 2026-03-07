import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.db.models.user import UserRole


class ComplaintStatus(str, enum.Enum):
    NEW = "NEW"
    REVIEWED = "REVIEWED"


class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"
    __table_args__ = (
        Index("ix_complaints_reporter_user_id", "reporter_user_id"),
        Index("ix_complaints_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reporter_role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True), nullable=False
    )
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus, name="complaint_status", native_enum=True),
        nullable=False,
        default=ComplaintStatus.NEW,
        server_default=ComplaintStatus.NEW.value,
    )
