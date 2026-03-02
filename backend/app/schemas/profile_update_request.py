import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import ProfileUpdateStatus


class ProfileUpdateRequestIn(BaseModel):
    payload_json: dict = Field(default_factory=dict)


class ProfileUpdateReviewIn(BaseModel):
    status: ProfileUpdateStatus
    admin_note: str | None = Field(default=None, max_length=2000)


class ProfileUpdateRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    doctor_user_id: uuid.UUID
    payload_json: dict
    status: ProfileUpdateStatus
    admin_note: str | None
    reviewed_at: datetime | None
    reviewer_admin_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
