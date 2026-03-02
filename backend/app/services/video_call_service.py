from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import (
    Appointment,
    AppointmentCallStatus,
    User,
    UserRole,
)


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
    }


def end_video_call(db: Session, *, appointment_id, actor_user: User) -> Appointment:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if actor_user.id not in {appointment.user_id, appointment.doctor_user_id} and actor_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    appointment.call_status = AppointmentCallStatus.ENDED
    db.commit()
    db.refresh(appointment)
    return appointment
