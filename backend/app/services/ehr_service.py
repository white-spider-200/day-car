from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import (
    Appointment,
    AppointmentStatus,
    PatientRecord,
    RecordDocument,
    RecordEntry,
    TreatmentRequest,
    TreatmentRequestStatus,
    User,
    UserRole,
)
from app.services.storage_service import save_document

_DOC_TOKEN_LIFETIME_SECONDS = 300


def _has_doctor_patient_relationship(db: Session, *, doctor_id, user_id) -> bool:
    has_appointment = db.scalar(
        select(Appointment.id).where(
            Appointment.doctor_user_id == doctor_id,
            Appointment.user_id == user_id,
            Appointment.status.in_(
                [
                    AppointmentStatus.REQUESTED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.NO_SHOW,
                ]
            ),
        )
    )
    if has_appointment:
        return True

    accepted_treatment_request = db.scalar(
        select(TreatmentRequest.id).where(
            TreatmentRequest.doctor_id == doctor_id,
            TreatmentRequest.user_id == user_id,
            TreatmentRequest.status == TreatmentRequestStatus.ACCEPTED,
        )
    )
    return accepted_treatment_request is not None


def create_patient_record(db: Session, *, doctor_user: User, user_id, title: str) -> PatientRecord:
    if doctor_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can create records")
    if not _has_doctor_patient_relationship(db, doctor_id=doctor_user.id, user_id=user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor is not assigned to this patient")

    record = PatientRecord(user_id=user_id, doctor_id=doctor_user.id, title=title.strip())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_doctor_records(db: Session, *, doctor_user: User, user_id=None) -> list[PatientRecord]:
    if doctor_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can list records")
    query = select(PatientRecord).where(PatientRecord.doctor_id == doctor_user.id)
    if user_id is not None:
        query = query.where(PatientRecord.user_id == user_id)
    return list(db.scalars(query.order_by(PatientRecord.updated_at.desc())))


def list_patient_records(db: Session, *, patient_user: User) -> list[PatientRecord]:
    if patient_user.role != UserRole.USER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only patients can view this list")
    return list(
        db.scalars(
            select(PatientRecord)
            .where(PatientRecord.user_id == patient_user.id)
            .order_by(PatientRecord.updated_at.desc())
        )
    )


def get_record_for_actor(db: Session, *, record_id, actor_user: User) -> PatientRecord:
    record = db.scalar(select(PatientRecord).where(PatientRecord.id == record_id))
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    if actor_user.role == UserRole.DOCTOR and record.doctor_id == actor_user.id:
        return record
    if actor_user.role == UserRole.USER and record.user_id == actor_user.id:
        return record
    if actor_user.role == UserRole.ADMIN:
        return record
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this record")


def list_record_entries(db: Session, *, record_id) -> list[RecordEntry]:
    return list(
        db.scalars(
            select(RecordEntry)
            .where(RecordEntry.record_id == record_id)
            .order_by(RecordEntry.created_at.desc())
        )
    )


def create_record_entry(db: Session, *, record: PatientRecord, doctor_user: User, entry_type, content: str) -> RecordEntry:
    if doctor_user.role != UserRole.DOCTOR or record.doctor_id != doctor_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned doctor can write entries")
    entry = RecordEntry(
        record_id=record.id,
        entry_type=entry_type,
        content=content.strip(),
        created_by_doctor_id=doctor_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def update_record_entry(db: Session, *, entry_id, doctor_user: User, content: str) -> RecordEntry:
    entry = db.scalar(select(RecordEntry).where(RecordEntry.id == entry_id))
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    record = db.scalar(select(PatientRecord).where(PatientRecord.id == entry.record_id))
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    if doctor_user.role != UserRole.DOCTOR or record.doctor_id != doctor_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned doctor can update entries")

    entry.content = content.strip()
    db.commit()
    db.refresh(entry)
    return entry


async def upload_record_document(db: Session, *, record: PatientRecord, doctor_user: User, file) -> RecordDocument:
    if doctor_user.role != UserRole.DOCTOR or record.doctor_id != doctor_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned doctor can upload documents")
    file_url = await save_document(file)
    document = RecordDocument(
        record_id=record.id,
        uploaded_by_doctor_id=doctor_user.id,
        file_name=file.filename or "document",
        content_type=file.content_type or "application/octet-stream",
        file_url=file_url,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def list_record_documents(db: Session, *, record_id) -> list[RecordDocument]:
    return list(
        db.scalars(
            select(RecordDocument)
            .where(RecordDocument.record_id == record_id)
            .order_by(RecordDocument.created_at.desc())
        )
    )


def _sign_document_token(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    signature = hmac.new(settings.video_token_secret.encode("utf-8"), raw, hashlib.sha256).digest()
    return f"{base64.urlsafe_b64encode(raw).decode('utf-8')}.{base64.urlsafe_b64encode(signature).decode('utf-8')}"


def _verify_document_token(token: str) -> dict:
    try:
        raw_payload, raw_sig = token.split(".", 1)
        payload_bytes = base64.urlsafe_b64decode(raw_payload.encode("utf-8"))
        sig_bytes = base64.urlsafe_b64decode(raw_sig.encode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token format") from exc

    expected_sig = hmac.new(settings.video_token_secret.encode("utf-8"), payload_bytes, hashlib.sha256).digest()
    if not hmac.compare_digest(sig_bytes, expected_sig):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token signature")

    payload = json.loads(payload_bytes.decode("utf-8"))
    now_ts = int(datetime.now(UTC).timestamp())
    if now_ts > int(payload.get("exp", 0)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Document token expired")
    return payload


def create_document_download_token(*, document_id, actor_user: User) -> str:
    expires_at = datetime.now(UTC) + timedelta(seconds=_DOC_TOKEN_LIFETIME_SECONDS)
    payload = {
        "document_id": str(document_id),
        "actor_user_id": str(actor_user.id),
        "exp": int(expires_at.timestamp()),
    }
    return _sign_document_token(payload)


def verify_document_download_access(db: Session, *, document_id, token: str, actor_user: User) -> RecordDocument:
    payload = _verify_document_token(token)
    if payload.get("document_id") != str(document_id) or payload.get("actor_user_id") != str(actor_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token does not match request")

    document = db.scalar(select(RecordDocument).where(RecordDocument.id == document_id))
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    record = db.scalar(select(PatientRecord).where(PatientRecord.id == document.record_id))
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    if actor_user.role == UserRole.ADMIN:
        return document
    if actor_user.role == UserRole.DOCTOR and record.doctor_id == actor_user.id:
        return document
    if actor_user.role == UserRole.USER and record.user_id == actor_user.id:
        return document
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this document")
