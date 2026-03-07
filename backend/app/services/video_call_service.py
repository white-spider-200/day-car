from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import (
    Appointment,
    AppointmentCallStatus,
    AppointmentStatus,
    DoctorProfile,
    User,
    UserRole,
)
from app.services.zoom_service import create_zoom_meeting_for_appointment, zoom_is_configured


def _sign_payload(payload: dict) -> str:
    data = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    signature = hmac.new(settings.video_token_secret.encode("utf-8"), data, hashlib.sha256).digest()
    return f"{base64.urlsafe_b64encode(data).decode('utf-8')}.{base64.urlsafe_b64encode(signature).decode('utf-8')}"


def _ensure_room(appointment: Appointment) -> None:
    if not appointment.call_provider:
        appointment.call_provider = settings.video_provider
    if not appointment.call_room_id:
        appointment.call_room_id = f"room_{secrets.token_hex(8)}"


def _assert_join_window(appointment: Appointment) -> None:
    now = datetime.now(UTC)
    start_allowed_at = appointment.start_at - timedelta(minutes=settings.video_join_window_minutes_before)
    end_allowed_at = appointment.end_at + timedelta(minutes=settings.video_join_window_minutes_after)
    if now < start_allowed_at or now > end_allowed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video room is only available around the scheduled appointment time",
        )


def generate_video_join_token(db: Session, *, appointment_id, actor_user: User) -> dict:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    is_participant = actor_user.id in {appointment.user_id, appointment.doctor_user_id}
    if actor_user.role != UserRole.ADMIN and not is_participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to join this call")

    if not appointment.fee_paid and actor_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Payment required before joining")

    # If Zoom is enabled and this appointment still has no link, try creating it lazily on join.
    if not appointment.meeting_link and zoom_is_configured():
        try:
            zoom_meeting = create_zoom_meeting_for_appointment(
                appointment_id=str(appointment.id),
                doctor_user_id=str(appointment.doctor_user_id),
                patient_user_id=str(appointment.user_id),
                start_at=appointment.start_at,
                end_at=appointment.end_at,
            )
            if zoom_meeting:
                appointment.meeting_link = zoom_meeting["meeting_link"]
                appointment.call_provider = zoom_meeting["provider"]
                appointment.call_room_id = zoom_meeting["room_id"]
                db.commit()
                db.refresh(appointment)
        except Exception:
            # Keep join flow usable even if Zoom API fails temporarily.
            pass

    _assert_join_window(appointment)
    _ensure_room(appointment)
    appointment.call_status = AppointmentCallStatus.LIVE
    db.commit()
    db.refresh(appointment)

    payload = {
        "sub": str(actor_user.id),
        "appointment_id": str(appointment.id),
        "room_id": appointment.call_room_id,
        "provider": appointment.call_provider,
        "iat": int(datetime.now(UTC).timestamp()),
    }
    return {
        "provider": appointment.call_provider,
        "room_id": appointment.call_room_id,
        "token": _sign_payload(payload),
        "meeting_link": appointment.meeting_link,
    }


def end_video_call(db: Session, *, appointment_id, actor_user: User) -> Appointment:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if actor_user.id not in {appointment.user_id, appointment.doctor_user_id} and actor_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    if appointment.call_status == AppointmentCallStatus.ENDED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Call already ended")
    if appointment.status not in {AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Call can only be ended for confirmed/completed appointments")
    appointment.call_status = AppointmentCallStatus.ENDED
    if appointment.status == AppointmentStatus.CONFIRMED:
        appointment.status = AppointmentStatus.COMPLETED
    db.commit()
    db.refresh(appointment)
    return appointment


def end_video_call_with_doctor_feedback(
    db: Session,
    *,
    appointment_id,
    actor_user: User,
    feedback_note: str,
) -> Appointment:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if actor_user.role != UserRole.ADMIN and actor_user.id != appointment.doctor_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the doctor can end with feedback")
    if appointment.call_status == AppointmentCallStatus.ENDED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Call already ended")
    if appointment.status not in {AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Call can only be ended for confirmed/completed appointments")

    cleaned_feedback = feedback_note.strip()
    if not cleaned_feedback:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="feedback_note is required")

    appointment.call_status = AppointmentCallStatus.ENDED
    if appointment.status == AppointmentStatus.CONFIRMED:
        appointment.status = AppointmentStatus.COMPLETED
    appointment.notes = cleaned_feedback
    db.commit()
    db.refresh(appointment)
    return appointment


def _refresh_doctor_rating_stats(db: Session, *, doctor_user_id) -> None:
    profile = db.scalar(select(DoctorProfile).where(DoctorProfile.doctor_user_id == doctor_user_id))
    if not profile:
        return
    row = db.execute(
        select(
            func.count(Appointment.id),
            func.avg(Appointment.feedback_rating),
        ).where(
            Appointment.doctor_user_id == doctor_user_id,
            Appointment.feedback_rating.is_not(None),
        )
    ).one()
    reviews_count = int(row[0] or 0)
    avg_rating = row[1]
    profile.reviews_count = reviews_count
    profile.rating = None if avg_rating is None else Decimal(str(round(float(avg_rating), 2)))


def submit_video_feedback(
    db: Session,
    *,
    appointment_id,
    actor_user: User,
    rating: int,
    comment: str | None,
) -> Appointment:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if actor_user.role != UserRole.ADMIN and actor_user.id != appointment.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the patient can submit feedback")
    if appointment.call_status != AppointmentCallStatus.ENDED and appointment.status != AppointmentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback can only be submitted after the call ends",
        )
    if appointment.feedback_submitted_at is not None or appointment.feedback_rating is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Feedback already submitted")
    appointment.feedback_rating = rating
    appointment.feedback_comment = (comment or "").strip() or None
    appointment.feedback_submitted_at = datetime.now(UTC)
    _refresh_doctor_rating_stats(db, doctor_user_id=appointment.doctor_user_id)
    db.commit()
    db.refresh(appointment)
    return appointment
