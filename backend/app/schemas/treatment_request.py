import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import TreatmentRequestStatus


class TreatmentRequestCreateIn(BaseModel):
    doctor_id: uuid.UUID
    message: str = Field(min_length=5, max_length=2000)


class TreatmentRequestUpdateIn(BaseModel):
    status: TreatmentRequestStatus
    doctor_note: str | None = Field(default=None, max_length=2000)


class TreatmentRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    doctor_id: uuid.UUID
    user_id: uuid.UUID
    status: TreatmentRequestStatus
    message: str
    doctor_note: str | None
    created_at: datetime
    updated_at: datetime
