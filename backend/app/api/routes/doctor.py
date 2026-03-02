import uuid
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import (
    ApplicationStatus,
    DoctorApplication,
    DoctorDocument,
    DocumentType,
    User,
    UserRole,
)
from app.db.session import get_db
from app.schemas.appointment import AppointmentOut, AppointmentRescheduleIn
from app.schemas.availability import (
    AvailabilityBulkIn,
    AvailabilityBulkOut,
    AvailabilityExceptionIn,
    AvailabilityExceptionOut,
    AvailabilityRuleIn,
    AvailabilityRuleOut,
    AvailabilitySlotOut,
)
from app.schemas.doctor_application import (
    ApplicationOut,
    ApplicationSaveRequest,
    SubmitApplicationResponse,
)
from app.schemas.doctor_document import DoctorDocumentOut
from app.services.appointment_service import (
    cancel_appointment,
    confirm_appointment,
    doctor_appointments,
    reschedule_appointment,
)
from app.services.availability_service import generate_slots, replace_exceptions, replace_rules
from app.services.doctor_directory_service import filter_doctors
from app.services.storage_service import save_document

router = APIRouter(prefix="/doctor", tags=["doctor"])


def _get_or_create_application(db: Session, doctor_user_id) -> DoctorApplication:
    app = db.scalar(
        select(DoctorApplication).where(DoctorApplication.doctor_user_id == doctor_user_id)
    )
    if app:
        return app

    app = DoctorApplication(
        doctor_user_id=doctor_user_id,
        status=ApplicationStatus.DRAFT,
        pricing_currency="JOD",
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/application", response_model=ApplicationOut)
def get_application(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    app = _get_or_create_application(db, current_user.id)
    return app


@router.post("/application/save", response_model=ApplicationOut)
def save_application(
    payload: ApplicationSaveRequest,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    app = _get_or_create_application(db, current_user.id)
    if app.status not in {ApplicationStatus.DRAFT, ApplicationStatus.NEEDS_CHANGES}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application cannot be edited in current status",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(app, field, value)

    db.commit()
    db.refresh(app)
    return app


@router.post("/application/submit", response_model=SubmitApplicationResponse)
def submit_application(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    app = _get_or_create_application(db, current_user.id)
    if app.status not in {ApplicationStatus.DRAFT, ApplicationStatus.NEEDS_CHANGES}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application cannot be submitted")

    app.status = ApplicationStatus.SUBMITTED
    app.submitted_at = datetime.now(UTC)
    app.rejection_reason = None
    db.commit()
    db.refresh(app)
    return SubmitApplicationResponse(status=app.status, submitted_at=app.submitted_at)


@router.post("/documents/upload", response_model=DoctorDocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    type: DocumentType = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    app = _get_or_create_application(db, current_user.id)
    file_url = await save_document(file)
    document = DoctorDocument(application_id=app.id, type=type, file_url=file_url)
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/documents", response_model=list[DoctorDocumentOut])
def list_documents(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    app = _get_or_create_application(db, current_user.id)
    docs = list(
        db.scalars(
            select(DoctorDocument)
            .where(DoctorDocument.application_id == app.id)
            .order_by(DoctorDocument.uploaded_at.desc())
        )
    )
    return docs


@router.get("/availability/rules", response_model=list[AvailabilityRuleOut])
def get_rules(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    from app.db.models import DoctorAvailabilityRule

    rules = list(
        db.scalars(
            select(DoctorAvailabilityRule)
            .where(DoctorAvailabilityRule.doctor_user_id == current_user.id)
            .order_by(DoctorAvailabilityRule.day_of_week, DoctorAvailabilityRule.start_time)
        )
    )
    return rules


@router.post("/availability/rules", response_model=list[AvailabilityRuleOut])
def set_rules(
    payload: list[AvailabilityRuleIn],
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    return replace_rules(db, doctor_user_id=current_user.id, rules=payload)


@router.get("/availability/exceptions", response_model=list[AvailabilityExceptionOut])
def get_exceptions(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    from app.db.models import DoctorAvailabilityException

    exceptions = list(
        db.scalars(
            select(DoctorAvailabilityException)
            .where(DoctorAvailabilityException.doctor_user_id == current_user.id)
            .order_by(DoctorAvailabilityException.date)
        )
    )
    return exceptions


@router.post("/availability/exceptions", response_model=list[AvailabilityExceptionOut])
def set_exceptions(
    payload: list[AvailabilityExceptionIn],
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    return replace_exceptions(db, doctor_user_id=current_user.id, exceptions=payload)


@router.post("/availability/bulk", response_model=AvailabilityBulkOut)
def bulk_set_availability(
    payload: AvailabilityBulkIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    rules = replace_rules(db, doctor_user_id=current_user.id, rules=payload.rules)
    exceptions = replace_exceptions(db, doctor_user_id=current_user.id, exceptions=payload.exceptions)
    return AvailabilityBulkOut(
        rules=[AvailabilityRuleOut.model_validate(item) for item in rules],
        exceptions=[AvailabilityExceptionOut.model_validate(item) for item in exceptions],
    )


@router.get("/availability/calendar", response_model=list[AvailabilitySlotOut])
def doctor_calendar_preview(
    date_from: date,
    date_to: date,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    return generate_slots(db, doctor_user_id=current_user.id, date_from=date_from, date_to=date_to)


@router.get("/appointments", response_model=list[AppointmentOut])
def my_doctor_appointments(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    return doctor_appointments(db, doctor_user_id=current_user.id)


@router.post("/appointments/{appointment_id}/confirm", response_model=AppointmentOut)
def confirm_doctor_appointment(
    appointment_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    return confirm_appointment(db, appointment_id=appointment_id, doctor_user=current_user)


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_doctor_appointment(
    appointment_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    return cancel_appointment(
        db, appointment_id=appointment_id, actor_user_id=current_user.id, doctor_user_id=current_user.id
    )


@router.post("/appointments/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_doctor_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentRescheduleIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    return reschedule_appointment(
        db,
        appointment_id=appointment_id,
        actor_user_id=current_user.id,
        doctor_user_id=current_user.id,
        new_start_at=payload.start_at,
        timezone=payload.timezone,
    )


@router.get("/referral-directory")
def referral_directory(
    specialty: str | None = None,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    _ = current_user
    return filter_doctors(db, specialty=specialty, public_only=True)
