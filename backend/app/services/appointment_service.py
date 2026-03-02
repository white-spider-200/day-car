from dataclasses import dataclass
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.db.models import (
    ApplicationStatus,
    Appointment,
    AppointmentCallStatus,
    AppointmentStatus,
    DoctorApplication,
    DoctorProfile,
    User,
    UserRole,
    UserStatus,
    WaitingListEntry,
)
from app.services.availability_service import resolve_slot
from app.services.notification_service import create_notification


@dataclass
class _ReleasedSlot:
    id: object
    doctor_user_id: object
    start_at: datetime
    end_at: datetime
    timezone: str
    call_provider: str | None
    call_room_id: str | None


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


def _find_conflicting_confirmed_appointment(
    db: Session,
    *,
    doctor_user_id,
    start_at,
    end_at,
):
    return db.scalar(
        select(Appointment).where(
            Appointment.doctor_user_id == doctor_user_id,
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.start_at < end_at,
            Appointment.end_at > start_at,
        )
    )


def _next_waiting_position(db: Session, *, appointment_id) -> int:
    max_position = db.scalar(
        select(func.max(WaitingListEntry.position)).where(WaitingListEntry.appointment_id == appointment_id)
    )
    return int(max_position or 0) + 1


def _rebalance_waiting_list_positions(db: Session, *, appointment_id) -> None:
    entries = list(
        db.scalars(
            select(WaitingListEntry)
            .where(WaitingListEntry.appointment_id == appointment_id)
            .order_by(WaitingListEntry.position, WaitingListEntry.created_at)
        )
    )
    for index, entry in enumerate(entries, start=1):
        entry.position = index


def _promote_first_waiting_user(db: Session, *, released_appointment) -> Appointment | None:
    first_in_line = db.scalar(
        select(WaitingListEntry)
        .where(WaitingListEntry.appointment_id == released_appointment.id)
        .order_by(WaitingListEntry.position, WaitingListEntry.created_at)
        .with_for_update()
    )
    if not first_in_line:
        return None

    promoted_appointment = Appointment(
        doctor_user_id=released_appointment.doctor_user_id,
        user_id=first_in_line.user_id,
        start_at=released_appointment.start_at,
        end_at=released_appointment.end_at,
        timezone=released_appointment.timezone,
        status=AppointmentStatus.REQUESTED,
        call_provider=released_appointment.call_provider,
        call_room_id=released_appointment.call_room_id,
        call_status=AppointmentCallStatus.NOT_READY,
        fee_paid=False,
    )
    db.add(promoted_appointment)
    db.delete(first_in_line)
    db.flush()
    _rebalance_waiting_list_positions(db, appointment_id=released_appointment.id)

    create_notification(
        db,
        user_id=promoted_appointment.user_id,
        event_type="WAITING_LIST_PROMOTED",
        title="A slot is now available",
        body="A booked slot became available and you were moved from waiting list to appointment request.",
        metadata_json={
            "source_appointment_id": str(released_appointment.id),
            "new_appointment_id": str(promoted_appointment.id),
        },
    )
    return promoted_appointment


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
        conflicting = _find_conflicting_confirmed_appointment(
            db,
            doctor_user_id=doctor_user_id,
            start_at=requested_start_at_utc,
            end_at=end_at_utc,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Requested slot is already booked",
                "conflicting_appointment_id": str(conflicting.id) if conflicting else None,
            },
        )

    appointment = Appointment(
        doctor_user_id=doctor_user_id,
        user_id=user.id,
        start_at=requested_start_at_utc,
        end_at=end_at_utc,
        timezone=timezone,
        status=AppointmentStatus.REQUESTED,
    )
    db.add(appointment)
    db.flush()

    create_notification(
        db,
        user_id=doctor_user_id,
        event_type="APPOINTMENT_REQUESTED",
        title="New appointment request",
        body="A patient requested an appointment slot.",
        metadata_json={"appointment_id": str(appointment.id), "user_id": str(user.id)},
    )
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
    create_notification(
        db,
        user_id=appointment.user_id,
        event_type="APPOINTMENT_CONFIRMED",
        title="Appointment confirmed",
        body="Your appointment has been confirmed by the doctor.",
        metadata_json={"appointment_id": str(appointment.id)},
    )
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
    promoted = _promote_first_waiting_user(db, released_appointment=appointment)
    create_notification(
        db,
        user_id=appointment.user_id,
        event_type="APPOINTMENT_CANCELLED",
        title="Appointment cancelled",
        body="Your appointment has been cancelled.",
        metadata_json={"appointment_id": str(appointment.id)},
    )
    if promoted:
        create_notification(
            db,
            user_id=appointment.doctor_user_id,
            event_type="WAITING_LIST_PROMOTION_CREATED",
            title="Waiting list patient promoted",
            body="The top waiting-list user has been promoted to a new appointment request.",
            metadata_json={
                "source_appointment_id": str(appointment.id),
                "new_appointment_id": str(promoted.id),
            },
        )
    db.commit()
    db.refresh(appointment)
    return appointment


def reschedule_appointment(
    db: Session,
    *,
    appointment_id,
    actor_user_id,
    new_start_at: datetime,
    timezone: str,
    doctor_user_id=None,
) -> Appointment:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    is_owner = appointment.user_id == actor_user_id
    is_doctor = doctor_user_id is not None and appointment.doctor_user_id == doctor_user_id
    if not is_owner and not is_doctor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to reschedule")

    if appointment.status in {AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment cannot be rescheduled")
    if new_start_at.tzinfo is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="start_at must be timezone-aware")

    new_start_at_utc = new_start_at.astimezone(UTC)
    new_end_at_utc, _ = resolve_slot(
        db,
        doctor_user_id=appointment.doctor_user_id,
        requested_start_at_utc=new_start_at_utc,
        check_confirmed_conflict=False,
    )
    if new_end_at_utc is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested slot is invalid")

    conflict = db.scalar(
        select(Appointment.id).where(
            Appointment.doctor_user_id == appointment.doctor_user_id,
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.id != appointment.id,
            Appointment.start_at < new_end_at_utc,
            Appointment.end_at > new_start_at_utc,
        )
    )
    if conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Requested slot is already booked")

    released_slot = _ReleasedSlot(
        id=appointment.id,
        doctor_user_id=appointment.doctor_user_id,
        start_at=appointment.start_at,
        end_at=appointment.end_at,
        timezone=appointment.timezone,
        call_provider=appointment.call_provider,
        call_room_id=appointment.call_room_id,
    )

    appointment.start_at = new_start_at_utc
    appointment.end_at = new_end_at_utc
    appointment.timezone = timezone
    appointment.status = AppointmentStatus.REQUESTED
    appointment.call_status = AppointmentCallStatus.NOT_READY
    appointment.fee_paid = False
    _promote_first_waiting_user(db, released_appointment=released_slot)
    create_notification(
        db,
        user_id=appointment.user_id,
        event_type="APPOINTMENT_RESCHEDULED",
        title="Appointment rescheduled",
        body="Your appointment time was updated.",
        metadata_json={"appointment_id": str(appointment.id)},
    )
    db.commit()
    db.refresh(appointment)
    return appointment


def join_waiting_list(db: Session, *, appointment_id, user: User) -> WaitingListEntry:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if appointment.user_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already assigned to this appointment")

    if appointment.status not in {AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Waiting list is closed for this appointment")

    existing = db.scalar(
        select(WaitingListEntry).where(
            WaitingListEntry.appointment_id == appointment_id,
            WaitingListEntry.user_id == user.id,
        )
    )
    if existing:
        return existing

    entry = WaitingListEntry(
        appointment_id=appointment_id,
        user_id=user.id,
        position=_next_waiting_position(db, appointment_id=appointment_id),
    )
    db.add(entry)
    db.flush()

    create_notification(
        db,
        user_id=appointment.doctor_user_id,
        event_type="WAITING_LIST_JOINED",
        title="User joined waiting list",
        body="A user joined the waiting list for one of your appointments.",
        metadata_json={"appointment_id": str(appointment_id), "user_id": str(user.id), "position": entry.position},
    )
    db.commit()
    db.refresh(entry)
    return entry


def get_waiting_list(db: Session, *, appointment_id, actor_user: User) -> tuple[list[WaitingListEntry], int | None]:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    is_related = actor_user.id in {appointment.user_id, appointment.doctor_user_id}
    is_admin = actor_user.role == UserRole.ADMIN
    if not is_related and not is_admin:
        # A queued user can still access own position.
        queued = db.scalar(
            select(WaitingListEntry.id).where(
                WaitingListEntry.appointment_id == appointment_id,
                WaitingListEntry.user_id == actor_user.id,
            )
        )
        if not queued:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view waiting list")

    entries = list(
        db.scalars(
            select(WaitingListEntry)
            .where(WaitingListEntry.appointment_id == appointment_id)
            .order_by(WaitingListEntry.position, WaitingListEntry.created_at)
        )
    )
    my_position = next((entry.position for entry in entries if entry.user_id == actor_user.id), None)
    return entries, my_position


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
