import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DocumentType(str, enum.Enum):
    LICENSE = "LICENSE"
    ID = "ID"
    DEGREE = "DEGREE"
    OTHER = "OTHER"


class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class DoctorDocument(Base):
    __tablename__ = "doctor_documents"
    __table_args__ = (Index("ix_doctor_documents_application_id", "application_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctor_applications.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type", native_enum=True), nullable=False
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="document_status", native_enum=True),
        nullable=False,
        default=DocumentStatus.PENDING,
        server_default=DocumentStatus.PENDING.value,
    )
    admin_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
