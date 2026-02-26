from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.db.models import (
    ApplicationStatus,
    Appointment,
    AppointmentStatus,
    DoctorApplication,
    DoctorProfile,
    User,
    UserStatus,
)
from app.services.availability_service import resolve_slot


def _ensure_doctor_bookable(db: Session, doctor_user_id):
    profile = db.scalar(
        select(DoctorProfile).where(
            DoctorProfile.doctor_user_id == doctor_user_id,
            DoctorProfile.is_public.is_(True),
        )
    )
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor is not bookable")

    doctor_user = db.scalar(select(User).where(User.id == doctor_user_id))
    if not doctor_user or doctor_user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor is not active")

    app = db.scalar(
        select(DoctorApplication).where(
            DoctorApplication.doctor_user_id == doctor_user_id,
            DoctorApplication.status == ApplicationStatus.APPROVED,
        )
    )
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor is not approved")


def request_appointment(
    db: Session,
    user: User,
    doctor_user_id,
    start_at: datetime,
    timezone: str,
) -> Appointment:
    if start_at.tzinfo is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="start_at must be timezone-aware")

    requested_start_at_utc = start_at.astimezone(UTC)
    _ensure_doctor_bookable(db, doctor_user_id)

    end_at_utc, has_conflict = resolve_slot(
        db,
        doctor_user_id=doctor_user_id,
        requested_start_at_utc=requested_start_at_utc,
        check_confirmed_conflict=True,
    )
    if end_at_utc is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested slot is invalid")
    if has_conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Requested slot is already booked")

    appointment = Appointment(
        doctor_user_id=doctor_user_id,
        user_id=user.id,
        start_at=requested_start_at_utc,
        end_at=end_at_utc,
        timezone=timezone,
        status=AppointmentStatus.REQUESTED,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def confirm_appointment(db: Session, appointment_id, doctor_user: User) -> Appointment:
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:lock_key))"), {"lock_key": str(doctor_user.id)})

    appointment = db.scalar(
        select(Appointment)
        .where(Appointment.id == appointment_id, Appointment.doctor_user_id == doctor_user.id)
        .with_for_update()
    )
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if appointment.status != AppointmentStatus.REQUESTED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment is not requestable")

    conflict = db.scalar(
        select(Appointment.id)
        .where(
            Appointment.doctor_user_id == doctor_user.id,
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.id != appointment.id,
            Appointment.start_at < appointment.end_at,
            Appointment.end_at > appointment.start_at,
        )
        .with_for_update()
    )
    if conflict:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This slot conflicts with another confirmed appointment",
        )

    appointment.status = AppointmentStatus.CONFIRMED
    db.commit()
    db.refresh(appointment)
    return appointment


def cancel_appointment(db: Session, appointment_id, actor_user_id, doctor_user_id=None) -> Appointment:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    is_owner = appointment.user_id == actor_user_id
    is_doctor = doctor_user_id is not None and appointment.doctor_user_id == doctor_user_id
    if not is_owner and not is_doctor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to cancel")

    if appointment.status in {AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment cannot be cancelled")

    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(appointment)
    return appointment


def doctor_appointments(db: Session, doctor_user_id) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment)
            .where(Appointment.doctor_user_id == doctor_user_id)
            .order_by(Appointment.start_at)
        )
    )


def user_appointments(db: Session, user_id) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment).where(Appointment.user_id == user_id).order_by(Appointment.start_at)
        )
    )
