import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PostCreateIn(BaseModel):
    content: str = Field(min_length=2, max_length=3000)


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    doctor_id: uuid.UUID
    content: str
    created_at: datetime


class TimelinePostOut(PostOut):
    likes_count: int
    liked_by_me: bool
