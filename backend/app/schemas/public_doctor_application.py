from decimal import Decimal
from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.core.professional_roles import ProfessionalType


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
    professional_type: ProfessionalType
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(pattern=r"^\+?[1-9]\d{6,14}$")
    national_id: str | None = Field(default=None, max_length=100)
    license_number: str | None = Field(default=None, min_length=3, max_length=120)
    license_issuing_authority: str | None = Field(default=None, min_length=2, max_length=255)
    license_expiry_date: date | None = None
    accreditation_body: str | None = Field(default=None, min_length=2, max_length=255)
    legal_prescription_declaration: str | None = None
    no_prescription_declaration: str | None = None
    psychiatrist_prescription_ack: bool | None = None
    therapist_no_prescription_ack: bool | None = None
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

    @field_validator("license_number")
    @classmethod
    def validate_license_number(cls, value: str | None, info):
        professional_type = info.data.get("professional_type")
        if professional_type == ProfessionalType.PSYCHIATRIST and (value is None or not value.strip()):
            raise ValueError("license_number is required for psychiatrists")
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_professional_requirements(self):
        if self.professional_type == ProfessionalType.PSYCHIATRIST:
            if not self.license_issuing_authority:
                raise ValueError("license_issuing_authority is required for psychiatrists")
            if not self.license_expiry_date:
                raise ValueError("license_expiry_date is required for psychiatrists")
            if not self.legal_prescription_declaration:
                raise ValueError("legal_prescription_declaration is required for psychiatrists")
            if self.psychiatrist_prescription_ack is not True:
                raise ValueError("psychiatrist_prescription_ack must be true for psychiatrists")
        else:
            if not self.accreditation_body:
                raise ValueError("accreditation_body is required for therapists")
            if not self.no_prescription_declaration:
                raise ValueError("no_prescription_declaration is required for therapists")
            if self.therapist_no_prescription_ack is not True:
                raise ValueError("therapist_no_prescription_ack must be true for therapists")
        return self


class PublicDoctorApplicationCreateOut(BaseModel):
    id: str
    status: str
    message: str
