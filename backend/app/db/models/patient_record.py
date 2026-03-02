import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class RecordEntryType(str, enum.Enum):
    DIAGNOSIS = "DIAGNOSIS"
    PRESCRIPTION = "PRESCRIPTION"
    TEST_RESULT = "TEST_RESULT"
    NOTE = "NOTE"


class PatientRecord(Base, TimestampMixin):
    __tablename__ = "patient_records"
    __table_args__ = (
        Index("ix_patient_records_user_id", "user_id"),
        Index("ix_patient_records_doctor_id", "doctor_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Patient Record", server_default="Patient Record")


class RecordEntry(Base, TimestampMixin):
    __tablename__ = "record_entries"
    __table_args__ = (
        Index("ix_record_entries_record_id", "record_id"),
        Index("ix_record_entries_created_by_doctor_id", "created_by_doctor_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patient_records.id", ondelete="CASCADE"), nullable=False
    )
    entry_type: Mapped[RecordEntryType] = mapped_column(
        Enum(RecordEntryType, name="record_entry_type", native_enum=True),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )


class RecordDocument(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_record_id", "record_id"),
        Index("ix_documents_uploaded_by_doctor_id", "uploaded_by_doctor_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patient_records.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by_doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
