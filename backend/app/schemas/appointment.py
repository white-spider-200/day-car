import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models import AppointmentStatus


class AppointmentRequestIn(BaseModel):
    doctor_user_id: uuid.UUID
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
    notes: str | None
    created_at: datetime
