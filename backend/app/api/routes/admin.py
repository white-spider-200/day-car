import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import (
    ApplicationStatus,
    DoctorApplication,
    DoctorDocument,
    DoctorProfile,
    DocumentStatus,
    User,
    UserRole,
)
from app.db.session import get_db
from app.schemas.admin import (
    RejectApplicationRequest,
    RequestChangesRequest,
    SetDocumentStatusRequest,
    TogglePublicRequest,
    UpdatePricingRequest,
)
from app.schemas.doctor_application import ApplicationOut
from app.schemas.doctor_document import DoctorDocumentOut
from app.schemas.doctor_profile import DoctorProfileOut
from app.services.approval_service import approve_application, reject_application, request_changes

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/applications", response_model=list[ApplicationOut])
def list_applications(
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    query = select(DoctorApplication).order_by(DoctorApplication.created_at.desc())
    if status_filter is not None:
        query = query.where(DoctorApplication.status == status_filter)
    return list(db.scalars(query))


@router.get("/applications/{application_id}", response_model=ApplicationOut)
def application_details(
    application_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    app = db.scalar(select(DoctorApplication).where(DoctorApplication.id == application_id))
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


@router.post("/applications/{application_id}/review-start", response_model=ApplicationOut)
def review_start(
    application_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    app = db.scalar(select(DoctorApplication).where(DoctorApplication.id == application_id))
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    app.status = ApplicationStatus.IN_REVIEW
    app.reviewer_admin_id = current_user.id
    app.reviewed_at = datetime.now(UTC)
    db.commit()
    db.refresh(app)
    return app


@router.post("/applications/{application_id}/approve", response_model=ApplicationOut)
def approve(
    application_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    app = db.scalar(select(DoctorApplication).where(DoctorApplication.id == application_id))
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return approve_application(db, app, admin=current_user)


@router.post("/applications/{application_id}/reject", response_model=ApplicationOut)
def reject(
    application_id: uuid.UUID,
    payload: RejectApplicationRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    app = db.scalar(select(DoctorApplication).where(DoctorApplication.id == application_id))
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return reject_application(db, app, admin=current_user, reason=payload.reason)


@router.post("/applications/{application_id}/request-changes", response_model=ApplicationOut)
def mark_needs_changes(
    application_id: uuid.UUID,
    payload: RequestChangesRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    app = db.scalar(select(DoctorApplication).where(DoctorApplication.id == application_id))
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return request_changes(db, app, admin=current_user, notes=payload.notes)


@router.post("/documents/{doc_id}/set-status", response_model=DoctorDocumentOut)
def set_document_status(
    doc_id: uuid.UUID,
    payload: SetDocumentStatusRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    doc = db.scalar(select(DoctorDocument).where(DoctorDocument.id == doc_id))
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if payload.status == DocumentStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PENDING is not allowed here")
    doc.status = payload.status
    doc.admin_comment = payload.comment
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/doctors/{doctor_user_id}/toggle-public", response_model=DoctorProfileOut)
def toggle_public(
    doctor_user_id: uuid.UUID,
    payload: TogglePublicRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    profile = db.scalar(select(DoctorProfile).where(DoctorProfile.doctor_user_id == doctor_user_id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    profile.is_public = payload.is_public
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/doctors/{doctor_user_id}/update-pricing", response_model=DoctorProfileOut)
def update_pricing(
    doctor_user_id: uuid.UUID,
    payload: UpdatePricingRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    profile = db.scalar(select(DoctorProfile).where(DoctorProfile.doctor_user_id == doctor_user_id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    profile.pricing_currency = payload.currency
    profile.pricing_per_session = payload.per_session
    profile.pricing_notes = payload.notes
    db.commit()
    db.refresh(profile)
    return profile
