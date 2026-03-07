import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic import Field

from app.db.models import AppointmentCallStatus, AppointmentStatus


class AppointmentRequestIn(BaseModel):
    doctor_user_id: uuid.UUID
    start_at: datetime
    timezone: str


class AppointmentRescheduleIn(BaseModel):
    start_at: datetime
    timezone: str


class AppointmentFeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class DoctorEndCallIn(BaseModel):
    feedback_note: str = Field(min_length=3, max_length=4000)


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
    feedback_rating: int | None
    feedback_comment: str | None
    feedback_submitted_at: datetime | None
    created_at: datetime
    patient_name: str | None = None
    patient_age: int | None = None
    patient_country: str | None = None
