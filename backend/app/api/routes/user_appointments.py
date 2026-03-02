import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.appointment import AppointmentOut, AppointmentRequestIn, AppointmentRescheduleIn
from app.schemas.waiting_list import WaitingListJoinResponse, WaitingListItemOut, WaitingListViewOut
from app.services.appointment_service import (
    cancel_appointment,
    get_waiting_list,
    join_waiting_list,
    request_appointment,
    reschedule_appointment,
    user_appointments,
)
from app.services.video_call_service import end_video_call, generate_video_join_token

router = APIRouter(tags=["appointments"])


@router.post("/appointments/request", response_model=AppointmentOut)
def create_appointment_request(
    payload: AppointmentRequestIn,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    return request_appointment(
        db,
        user=current_user,
        doctor_user_id=payload.doctor_user_id,
        start_at=payload.start_at,
        timezone=payload.timezone,
    )


@router.get("/appointments/my", response_model=list[AppointmentOut])
def list_my_appointments(
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    return user_appointments(db, user_id=current_user.id)


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_my_appointment(
    appointment_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    return cancel_appointment(db, appointment_id=appointment_id, actor_user_id=current_user.id)


@router.post("/appointments/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_my_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentRescheduleIn,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    return reschedule_appointment(
        db,
        appointment_id=appointment_id,
        actor_user_id=current_user.id,
        new_start_at=payload.start_at,
        timezone=payload.timezone,
    )


@router.post("/appointments/{appointment_id}/waiting-list", response_model=WaitingListJoinResponse)
def join_appointment_waiting_list(
    appointment_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    entry = join_waiting_list(db, appointment_id=appointment_id, user=current_user)
    return WaitingListJoinResponse(
        appointment_id=entry.appointment_id,
        user_id=entry.user_id,
        position=entry.position,
        created_at=entry.created_at,
    )


@router.get("/appointments/{appointment_id}/waiting-list", response_model=WaitingListViewOut)
def get_appointment_waiting_list(
    appointment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries, my_position = get_waiting_list(db, appointment_id=appointment_id, actor_user=current_user)
    if current_user.role == UserRole.USER:
        filtered_entries = [entry for entry in entries if entry.user_id == current_user.id]
    else:
        filtered_entries = entries
    return WaitingListViewOut(
        appointment_id=appointment_id,
        total=len(entries),
        my_position=my_position,
        entries=[WaitingListItemOut.model_validate(entry) for entry in filtered_entries],
    )


@router.post("/appointments/{appointment_id}/video-join")
def join_appointment_video(
    appointment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_video_join_token(db, appointment_id=appointment_id, actor_user=current_user)


@router.post("/appointments/{appointment_id}/video-end", response_model=AppointmentOut)
def close_appointment_video(
    appointment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return end_video_call(db, appointment_id=appointment_id, actor_user=current_user)
