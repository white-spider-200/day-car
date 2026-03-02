from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    DoctorProfile,
    DoctorProfileUpdateRequest,
    ProfileUpdateStatus,
    User,
    UserRole,
)

_ALLOWED_PROFILE_FIELDS = {
    "display_name",
    "headline",
    "bio",
    "approach_text",
    "languages",
    "specialties",
    "session_types",
    "location_country",
    "location_city",
    "clinic_name",
    "address_line",
    "map_url",
    "pricing_currency",
    "pricing_per_session",
    "follow_up_price",
    "pricing_notes",
    "photo_url",
}


def submit_profile_update_request(
    db: Session,
    *,
    doctor_user: User,
    payload_json: dict,
) -> DoctorProfileUpdateRequest:
    if doctor_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can submit updates")

    request = DoctorProfileUpdateRequest(
        doctor_user_id=doctor_user.id,
        payload_json=payload_json,
        status=ProfileUpdateStatus.PENDING,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def list_my_profile_update_requests(db: Session, *, doctor_user: User) -> list[DoctorProfileUpdateRequest]:
    return list(
        db.scalars(
            select(DoctorProfileUpdateRequest)
            .where(DoctorProfileUpdateRequest.doctor_user_id == doctor_user.id)
            .order_by(DoctorProfileUpdateRequest.created_at.desc())
        )
    )


def list_profile_update_requests_for_admin(
    db: Session, *, status_filter: ProfileUpdateStatus | None = None
) -> list[DoctorProfileUpdateRequest]:
    query = select(DoctorProfileUpdateRequest).order_by(DoctorProfileUpdateRequest.created_at.desc())
    if status_filter:
        query = query.where(DoctorProfileUpdateRequest.status == status_filter)
    return list(db.scalars(query))


def review_profile_update_request(
    db: Session,
    *,
    request_id,
    admin_user: User,
    status_update: ProfileUpdateStatus,
    admin_note: str | None,
) -> DoctorProfileUpdateRequest:
    if admin_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can review updates")

    request = db.scalar(select(DoctorProfileUpdateRequest).where(DoctorProfileUpdateRequest.id == request_id))
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Update request not found")
    if request.status != ProfileUpdateStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request already reviewed")

    request.status = status_update
    request.admin_note = admin_note
    request.reviewed_at = datetime.now(UTC)
    request.reviewer_admin_id = admin_user.id

    if status_update == ProfileUpdateStatus.APPROVED:
        profile = db.scalar(select(DoctorProfile).where(DoctorProfile.doctor_user_id == request.doctor_user_id))
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
        for field, value in request.payload_json.items():
            if field in _ALLOWED_PROFILE_FIELDS:
                setattr(profile, field, value)

    db.commit()
    db.refresh(request)
    return request
