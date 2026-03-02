import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import ReferralStatus


class ReferralCreateIn(BaseModel):
    receiver_doctor_id: uuid.UUID
    patient_id: uuid.UUID
    note: str | None = Field(default=None, max_length=2000)


class ReferralUpdateIn(BaseModel):
    status: ReferralStatus
    note: str | None = Field(default=None, max_length=2000)


class ReferralOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sender_doctor_id: uuid.UUID
    receiver_doctor_id: uuid.UUID
    patient_id: uuid.UUID
    status: ReferralStatus
    note: str | None
    created_at: datetime
    updated_at: datetime
