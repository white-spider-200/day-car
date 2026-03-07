import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import ComplaintStatus, UserRole


class ComplaintCreateIn(BaseModel):
    subject: str | None = Field(default=None, max_length=255)
    text: str = Field(min_length=5, max_length=5000)


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reporter_user_id: uuid.UUID
    reporter_role: UserRole
    subject: str | None
    text: str
    status: ComplaintStatus
    created_at: datetime
    updated_at: datetime


class AdminComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reporter_user_id: uuid.UUID
    reporter_role: UserRole
    reporter_email: str | None
    reporter_name: str | None
    subject: str | None
    text: str
    status: ComplaintStatus
    created_at: datetime
