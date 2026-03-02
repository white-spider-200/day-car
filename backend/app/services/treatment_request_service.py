from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    DoctorProfile,
    TreatmentRequest,
    TreatmentRequestStatus,
    User,
    UserRole,
)
from app.services.notification_service import create_notification


def create_treatment_request(db: Session, *, user: User, doctor_id, message: str) -> TreatmentRequest:
    if user.role != UserRole.USER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only users can create treatment requests")

    doctor_profile = db.scalar(select(DoctorProfile).where(DoctorProfile.doctor_user_id == doctor_id))
    if not doctor_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    existing = db.scalar(
        select(TreatmentRequest).where(
            TreatmentRequest.user_id == user.id,
            TreatmentRequest.doctor_id == doctor_id,
            TreatmentRequest.status == TreatmentRequestStatus.PENDING,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have a pending request for this doctor")

    request = TreatmentRequest(
        doctor_id=doctor_id,
        user_id=user.id,
        status=TreatmentRequestStatus.PENDING,
        message=message.strip(),
    )
    db.add(request)
    db.flush()

    create_notification(
        db,
        user_id=doctor_id,
        event_type="TREATMENT_REQUEST_CREATED",
        title="New treatment request",
        body="A new patient has sent a treatment request.",
        metadata_json={"treatment_request_id": str(request.id), "user_id": str(user.id)},
    )
    db.commit()
    db.refresh(request)
    return request


def list_doctor_treatment_requests(db: Session, *, doctor_user_id) -> list[TreatmentRequest]:
    return list(
        db.scalars(
            select(TreatmentRequest)
            .where(TreatmentRequest.doctor_id == doctor_user_id)
            .order_by(TreatmentRequest.created_at.desc())
        )
    )


def update_treatment_request(
    db: Session,
    *,
    request_id,
    doctor_user: User,
    status_update: TreatmentRequestStatus,
    doctor_note: str | None,
) -> TreatmentRequest:
    if doctor_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can update requests")

    request = db.scalar(select(TreatmentRequest).where(TreatmentRequest.id == request_id))
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment request not found")
    if request.doctor_id != doctor_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your treatment request")

    request.status = status_update
    request.doctor_note = doctor_note
    db.flush()

    create_notification(
        db,
        user_id=request.user_id,
        event_type="TREATMENT_REQUEST_UPDATED",
        title="Treatment request update",
        body=f"Your request status is now {status_update.value}.",
        metadata_json={"treatment_request_id": str(request.id), "status": status_update.value},
    )
    db.commit()
    db.refresh(request)
    return request


def doctor_has_assigned_patient(db: Session, *, doctor_id, user_id) -> bool:
    approved_request = db.scalar(
        select(TreatmentRequest.id).where(
            TreatmentRequest.doctor_id == doctor_id,
            TreatmentRequest.user_id == user_id,
            TreatmentRequest.status == TreatmentRequestStatus.ACCEPTED,
        )
    )
    return approved_request is not None
