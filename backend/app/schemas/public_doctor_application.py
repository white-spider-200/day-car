from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


WeekDay = Literal["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]


class WeeklySlotIn(BaseModel):
    day: WeekDay
    start: str = Field(pattern=r"^\d{2}:\d{2}$")
    end: str = Field(pattern=r"^\d{2}:\d{2}$")

    @field_validator("end")
    @classmethod
    def validate_slot_range(cls, end_value: str, info):
        start_value = info.data.get("start")
        if start_value and end_value <= start_value:
            raise ValueError("end time must be after start time")
        return end_value


class PublicDoctorApplicationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(pattern=r"^\+?[1-9]\d{6,14}$")
    national_id: str | None = Field(default=None, max_length=100)
    license_number: str = Field(min_length=3, max_length=120)
    experience_years: int = Field(ge=0, le=80)
    specialty: str = Field(min_length=2, max_length=120)
    sub_specialties: list[str] | None = None
    languages: list[str] = Field(min_length=1)
    location: str = Field(min_length=2, max_length=120)
    location_country: str | None = Field(default=None, max_length=120)
    clinic_name: str | None = Field(default=None, max_length=255)
    address_line: str | None = Field(default=None, max_length=255)
    map_url: str | None = Field(default=None, max_length=1000)
    online_available: bool
    fee: Decimal = Field(ge=0)
    short_bio: str = Field(min_length=10, max_length=400)
    about: str | None = Field(default=None, max_length=6000)
    schedule: list[WeeklySlotIn] = Field(min_length=1)

    @field_validator("sub_specialties")
    @classmethod
    def clean_sub_specialties(cls, value: list[str] | None):
        if value is None:
            return None
        output: list[str] = []
        seen: set[str] = set()
        for item in value:
            cleaned = item.strip()
            if not cleaned:
                continue
            lowered = cleaned.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            output.append(cleaned[:120])
        return output or None

    @field_validator("languages")
    @classmethod
    def clean_languages(cls, value: list[str]):
        output: list[str] = []
        seen: set[str] = set()
        for item in value:
            cleaned = item.strip()
            if not cleaned:
                continue
            lowered = cleaned.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            output.append(cleaned[:64])
        if not output:
            raise ValueError("at least one language is required")
        return output


class PublicDoctorApplicationCreateOut(BaseModel):
    id: str
    status: str
    message: str
