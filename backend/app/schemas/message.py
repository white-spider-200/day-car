import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreateIn(BaseModel):
    receiver_user_id: uuid.UUID
    subject: str | None = Field(default=None, max_length=255)
    body: str = Field(min_length=1, max_length=5000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sender_user_id: uuid.UUID
    receiver_user_id: uuid.UUID
    subject: str | None
    body: str
    read_at: datetime | None
    created_at: datetime
