import uuid
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import (
    ApplicationStatus,
    Appointment,
    AppointmentStatus,
    DoctorApplication,
    DoctorDocument,
    DocumentType,
    User,
    UserRole,
)
from app.db.session import get_db
from app.schemas.appointment import AppointmentOut, AppointmentRescheduleIn, DoctorEndCallIn
from app.schemas.availability import (
    AvailabilityBulkIn,
    AvailabilityBulkOut,
    AvailabilityExceptionIn,
    AvailabilityExceptionOut,
    AvailabilityRuleIn,
    AvailabilityRuleOut,
    AvailabilitySlotOut,
)
from app.schemas.doctor_financial import DoctorFinancialSummaryOut
from app.schemas.doctor_application import (
    ApplicationOut,
    ApplicationSaveRequest,
    SubmitApplicationResponse,
)
from app.schemas.doctor_document import DoctorDocumentOut
from app.schemas.users import DoctorPatientProfileOut
from app.services.appointment_service import (
    cancel_appointment,
    confirm_appointment,
    doctor_appointments,
    reschedule_appointment,
)
from app.services.availability_service import generate_slots, replace_exceptions, replace_rules
from app.services.doctor_directory_service import filter_doctors
from app.services.professional_type_service import validate_application_by_professional_type
from app.services.payment_service import doctor_financial_summary
from app.services.storage_service import save_document
from app.services.video_call_service import end_video_call_with_doctor_feedback

router = APIRouter(prefix="/doctor", tags=["doctor"])


def _attach_patient_info(appointment, user: User | None):
    appointment.patient_name = user.name if user else None
    appointment.patient_age = user.age if user else None
    appointment.patient_country = user.country if user else None
    return appointment


def _attach_patient_info_batch(db: Session, appointments: list):
    if not appointments:
        return appointments

    user_ids = {item.user_id for item in appointments}
    users = list(db.scalars(select(User).where(User.id.in_(user_ids))))
    users_by_id = {item.id: item for item in users}
    for item in appointments:
        _attach_patient_info(item, users_by_id.get(item.user_id))
    return appointments


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
    if app.status not in {ApplicationStatus.DRAFT, ApplicationStatus.NEEDS_CHANGES, ApplicationStatus.NEEDS_MORE_INFO}:
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
    if app.status not in {ApplicationStatus.DRAFT, ApplicationStatus.NEEDS_CHANGES, ApplicationStatus.NEEDS_MORE_INFO}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application cannot be submitted")

    validate_application_by_professional_type(db, app)
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
    appointments = doctor_appointments(db, doctor_user_id=current_user.id)
    return _attach_patient_info_batch(db, appointments)


@router.get("/financial-summary", response_model=DoctorFinancialSummaryOut)
def get_doctor_financial_summary(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    payload = doctor_financial_summary(db, doctor_user_id=current_user.id)
    return DoctorFinancialSummaryOut.model_validate(payload)


@router.post("/appointments/{appointment_id}/confirm", response_model=AppointmentOut)
def confirm_doctor_appointment(
    appointment_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    appointment = confirm_appointment(db, appointment_id=appointment_id, doctor_user=current_user)
    patient = db.scalar(select(User).where(User.id == appointment.user_id))
    return _attach_patient_info(appointment, patient)


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_doctor_appointment(
    appointment_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    appointment = cancel_appointment(
        db, appointment_id=appointment_id, actor_user_id=current_user.id, doctor_user_id=current_user.id
    )
    patient = db.scalar(select(User).where(User.id == appointment.user_id))
    return _attach_patient_info(appointment, patient)


@router.post("/appointments/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_doctor_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentRescheduleIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    appointment = reschedule_appointment(
        db,
        appointment_id=appointment_id,
        actor_user_id=current_user.id,
        doctor_user_id=current_user.id,
        new_start_at=payload.start_at,
        timezone=payload.timezone,
    )
    patient = db.scalar(select(User).where(User.id == appointment.user_id))
    return _attach_patient_info(appointment, patient)


@router.post("/appointments/{appointment_id}/video-end", response_model=AppointmentOut)
def end_doctor_video_call_with_feedback(
    appointment_id: uuid.UUID,
    payload: DoctorEndCallIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    appointment = end_video_call_with_doctor_feedback(
        db,
        appointment_id=appointment_id,
        actor_user=current_user,
        feedback_note=payload.feedback_note,
    )
    patient = db.scalar(select(User).where(User.id == appointment.user_id))
    return _attach_patient_info(appointment, patient)


@router.get("/referral-directory")
def referral_directory(
    specialty: str | None = None,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    _ = current_user
    return filter_doctors(db, specialty=specialty, public_only=True)


@router.get("/patients/{patient_user_id}/profile", response_model=DoctorPatientProfileOut)
def get_patient_profile_for_doctor(
    patient_user_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    allowed = db.scalar(
        select(Appointment.id).where(
            Appointment.doctor_user_id == current_user.id,
            Appointment.user_id == patient_user_id,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW]),
        )
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient profile is available only after appointment confirmation.",
        )

    patient = db.scalar(
        select(User).where(
            User.id == patient_user_id,
            User.role == UserRole.USER,
        )
    )
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    shared_rows = db.execute(
        select(
            Appointment.id,
            Appointment.doctor_user_id,
            Appointment.notes,
            Appointment.end_at,
            User.name,
        )
        .join(User, User.id == Appointment.doctor_user_id)
        .where(
            Appointment.user_id == patient_user_id,
            Appointment.status == AppointmentStatus.COMPLETED,
            Appointment.notes.is_not(None),
        )
        .order_by(Appointment.end_at.desc())
    ).all()

    shared_notes = [
        {
            "appointment_id": row.id,
            "doctor_user_id": row.doctor_user_id,
            "doctor_name": row.name or f"Doctor {str(row.doctor_user_id)[:8]}",
            "noted_at": row.end_at,
            "note": row.notes,
        }
        for row in shared_rows
        if row.notes and str(row.notes).strip()
    ]

    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "country": patient.country,
        "shared_session_notes": shared_notes,
    }
