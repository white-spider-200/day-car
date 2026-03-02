import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models import AppointmentCallStatus, AppointmentStatus


class AppointmentRequestIn(BaseModel):
    doctor_user_id: uuid.UUID
    start_at: datetime
    timezone: str


class AppointmentRescheduleIn(BaseModel):
    start_at: datetime
    timezone: str


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    doctor_user_id: uuid.UUID
    user_id: uuid.UUID
    start_at: datetime
    end_at: datetime
    timezone: str
    status: AppointmentStatus
    meeting_link: str | None
    call_provider: str | None
    call_room_id: str | None
    call_status: AppointmentCallStatus
    fee_paid: bool
    notes: str | None
    created_at: datetime
