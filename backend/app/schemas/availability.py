import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.db.models import RecurrenceType


class AvailabilityRuleIn(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    timezone: str = "Asia/Amman"
    slot_duration_minutes: int = Field(default=50, ge=10, le=240)
    buffer_minutes: int = Field(default=10, ge=0, le=120)
    is_blocked: bool = False
    effective_from: date | None = None
    effective_to: date | None = None

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        if self.effective_from and self.effective_to and self.effective_to < self.effective_from:
            raise ValueError("effective_to must be >= effective_from")
        return self


class AvailabilityRuleOut(AvailabilityRuleIn):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class AvailabilityExceptionIn(BaseModel):
    date: date
    is_unavailable: bool = True
    is_blocking: bool = True
    is_recurring: bool = False
    recurrence_type: RecurrenceType | None = None
    recurrence_interval: int = Field(default=1, ge=1, le=52)
    recurrence_until: date | None = None
    weekday: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    note: str | None = None

    @model_validator(mode="after")
    def validate_exception(self):
        if (self.start_time is None) ^ (self.end_time is None):
            raise ValueError("start_time and end_time must both be set for partial exceptions")
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        if self.is_recurring and self.recurrence_type is None:
            raise ValueError("recurrence_type is required when is_recurring is true")
        if self.recurrence_type and not self.is_recurring:
            raise ValueError("is_recurring must be true when recurrence_type is provided")
        if self.recurrence_until and self.recurrence_until < self.date:
            raise ValueError("recurrence_until must be >= date")
        return self


class AvailabilityExceptionOut(AvailabilityExceptionIn):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class AvailabilitySlotOut(BaseModel):
    start_at: datetime
    end_at: datetime
    timezone: str


class AvailabilityBulkIn(BaseModel):
    rules: list[AvailabilityRuleIn] = Field(default_factory=list)
    exceptions: list[AvailabilityExceptionIn] = Field(default_factory=list)


class AvailabilityBulkOut(BaseModel):
    rules: list[AvailabilityRuleOut]
    exceptions: list[AvailabilityExceptionOut]
