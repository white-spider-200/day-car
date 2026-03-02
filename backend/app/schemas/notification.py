import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models import NotificationChannel


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    event_type: str
    title: str
    body: str
    channel: NotificationChannel
    metadata_json: dict | None
    is_read: bool
    sent_at: datetime


class NotificationMarkReadOut(BaseModel):
    marked: int
