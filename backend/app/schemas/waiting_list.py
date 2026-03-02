import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WaitingListJoinResponse(BaseModel):
    appointment_id: uuid.UUID
    user_id: uuid.UUID
    position: int
    created_at: datetime


class WaitingListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    appointment_id: uuid.UUID
    user_id: uuid.UUID
    position: int
    created_at: datetime


class WaitingListViewOut(BaseModel):
    appointment_id: uuid.UUID
    total: int
    my_position: int | None
    entries: list[WaitingListItemOut]
