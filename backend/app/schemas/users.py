import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models import UserRole, UserStatus


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str | None
    phone: str | None
    name: str | None
    age: int | None
    country: str | None
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime


class DoctorPatientProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    class SharedSessionNoteOut(BaseModel):
        appointment_id: uuid.UUID
        doctor_user_id: uuid.UUID
        doctor_name: str
        noted_at: datetime
        note: str

    id: uuid.UUID
    name: str | None
    age: int | None
    country: str | None
    shared_session_notes: list[SharedSessionNoteOut] = []
