import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, case, cast, func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import (
    ApplicationStatus,
    Appointment,
    AppointmentStatus,
    DoctorApplication,
    DoctorDocument,
    DoctorProfile,
    DocumentStatus,
    User,
    UserRole,
    UserStatus,
)
from app.db.session import get_db
from app.schemas.admin import (
    AdminApplicationNoteRequest,
    ApproveApplicationRequest,
    RejectApplicationRequest,
    RequestChangesRequest,
    SetDocumentStatusRequest,
    TogglePublicRequest,
    UpdatePricingRequest,
)
from app.schemas.admin_users import (
    AdminUserAppointmentOut,
    AdminUserDetailOut,
    AdminUserListItem,
)
from app.schemas.doctor_application import ApplicationOut
from app.schemas.doctor_document import DoctorDocumentOut
from app.schemas.doctor_profile import DoctorProfileOut
from app.schemas.users import UserOut
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
    payload: ApproveApplicationRequest | None = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    app = db.scalar(select(DoctorApplication).where(DoctorApplication.id == application_id))
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return approve_application(db, app, admin=current_user, note=payload.note if payload else None)


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
    return reject_application(db, app, admin=current_user, reason=payload.reason, note=payload.note)


@router.post("/applications/{application_id}/note", response_model=ApplicationOut)
def add_admin_note(
    application_id: uuid.UUID,
    payload: AdminApplicationNoteRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    app = db.scalar(select(DoctorApplication).where(DoctorApplication.id == application_id))
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    app.admin_note = payload.admin_note
    app.internal_notes = payload.admin_note
    db.commit()
    db.refresh(app)
    return app


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


@router.get("/users", response_model=list[AdminUserListItem])
def list_users(
    search: str | None = Query(default=None, min_length=1, max_length=255),
    status_filter: UserStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user

    query = select(User).where(User.role == UserRole.USER)

    if status_filter is not None:
        query = query.where(User.status == status_filter)

    if search is not None:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.email.ilike(term),
                User.phone.ilike(term),
                cast(User.id, String).ilike(term),
            )
        )

    users = list(db.scalars(query.order_by(User.created_at.desc())))
    if not users:
        return []

    user_ids = [user.id for user in users]

    stats_rows = db.execute(
        select(
            Appointment.user_id.label("user_id"),
            func.count(Appointment.id).label("appointments_count"),
            func.count(
                case(
                    (
                        Appointment.status.in_([
                            AppointmentStatus.REQUESTED,
                            AppointmentStatus.CONFIRMED,
                        ]),
                        1,
                    )
                )
            ).label("upcoming_count"),
            func.count(case((Appointment.status == AppointmentStatus.COMPLETED, 1))).label("completed_count"),
            func.count(case((Appointment.status == AppointmentStatus.CANCELLED, 1))).label("cancelled_count"),
            func.max(Appointment.start_at).label("last_appointment_at"),
        )
        .where(Appointment.user_id.in_(user_ids))
        .group_by(Appointment.user_id)
    ).all()

    stats_by_user = {
        row.user_id: {
            "appointments_count": int(row.appointments_count or 0),
            "upcoming_count": int(row.upcoming_count or 0),
            "completed_count": int(row.completed_count or 0),
            "cancelled_count": int(row.cancelled_count or 0),
            "last_appointment_at": row.last_appointment_at,
        }
        for row in stats_rows
    }

    response: list[AdminUserListItem] = []
    for user in users:
        stats = stats_by_user.get(
            user.id,
            {
                "appointments_count": 0,
                "upcoming_count": 0,
                "completed_count": 0,
                "cancelled_count": 0,
                "last_appointment_at": None,
            },
        )
        response.append(
            AdminUserListItem(
                id=user.id,
                email=user.email,
                phone=user.phone,
                role=user.role,
                status=user.status,
                created_at=user.created_at,
                updated_at=user.updated_at,
                appointments_count=stats["appointments_count"],
                upcoming_count=stats["upcoming_count"],
                completed_count=stats["completed_count"],
                cancelled_count=stats["cancelled_count"],
                last_appointment_at=stats["last_appointment_at"],
            )
        )

    return response


@router.get("/users/{user_id}", response_model=AdminUserDetailOut)
def get_user_details(
    user_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user

    user = db.scalar(select(User).where(User.id == user_id, User.role == UserRole.USER))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    appointment_rows = db.execute(
        select(Appointment, DoctorProfile.display_name)
        .outerjoin(DoctorProfile, DoctorProfile.doctor_user_id == Appointment.doctor_user_id)
        .where(Appointment.user_id == user_id)
        .order_by(Appointment.start_at.desc())
    ).all()

    appointments: list[AdminUserAppointmentOut] = []
    for appointment, doctor_display_name in appointment_rows:
        appointments.append(
            AdminUserAppointmentOut(
                id=appointment.id,
                doctor_user_id=appointment.doctor_user_id,
                doctor_display_name=doctor_display_name,
                start_at=appointment.start_at,
                end_at=appointment.end_at,
                timezone=appointment.timezone,
                status=appointment.status,
                meeting_link=appointment.meeting_link,
                notes=appointment.notes,
                created_at=appointment.created_at,
            )
        )

    upcoming_count = sum(
        1 for appointment in appointments if appointment.status in {AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED}
    )
    completed_count = sum(1 for appointment in appointments if appointment.status == AppointmentStatus.COMPLETED)
    cancelled_count = sum(1 for appointment in appointments if appointment.status == AppointmentStatus.CANCELLED)

    return AdminUserDetailOut(
        user=UserOut.model_validate(user),
        appointments_count=len(appointments),
        upcoming_count=upcoming_count,
        completed_count=completed_count,
        cancelled_count=cancelled_count,
        last_appointment_at=appointments[0].start_at if appointments else None,
        appointments=appointments,
    )
