import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.appointment import AppointmentOut, AppointmentRequestIn
from app.services.appointment_service import cancel_appointment, request_appointment, user_appointments

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
