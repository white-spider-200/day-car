import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import PrescriptionStatus


class PrescriptionCreateIn(BaseModel):
    user_id: uuid.UUID
    medication_name: str = Field(min_length=2, max_length=255)
    dosage: str = Field(min_length=2, max_length=255)
    instructions: str = Field(min_length=5, max_length=4000)
    quantity: str = Field(min_length=1, max_length=120)
    valid_days: int | None = Field(default=30, ge=1, le=365)


class PrescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    doctor_user_id: uuid.UUID
    user_id: uuid.UUID
    medication_name: str
    dosage: str
    instructions: str
    quantity: str
    issued_at: datetime
    valid_until: datetime | None
    verification_code: str
    data_hash: str
    pdf_url: str
    status: PrescriptionStatus
    verification_url: str = ""
    verification_qr_data_url: str = ""


class PrescriptionVerifyOut(BaseModel):
    prescription_id: uuid.UUID
    is_valid: bool
    status: PrescriptionStatus
    issued_at: datetime
    valid_until: datetime | None
    doctor: dict[str, str | None]
    patient: dict[str, str | None]
    medication: dict[str, str]
    data_hash: str
    pdf_url: str
