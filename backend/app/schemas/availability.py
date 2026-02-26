import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AvailabilityRuleIn(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    timezone: str = "Asia/Amman"
    slot_duration_minutes: int = Field(default=50, ge=10, le=240)
    buffer_minutes: int = Field(default=10, ge=0, le=120)

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class AvailabilityRuleOut(AvailabilityRuleIn):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class AvailabilityExceptionIn(BaseModel):
    date: date
    is_unavailable: bool = True
    start_time: time | None = None
    end_time: time | None = None
    note: str | None = None

    @model_validator(mode="after")
    def validate_exception(self):
        if (self.start_time is None) ^ (self.end_time is None):
            raise ValueError("start_time and end_time must both be set for partial exceptions")
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class AvailabilityExceptionOut(AvailabilityExceptionIn):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class AvailabilitySlotOut(BaseModel):
    start_at: datetime
    end_at: datetime
    timezone: str
