import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models import AppointmentStatus, UserRole, UserStatus
from app.schemas.users import UserOut


class AdminUserListItem(BaseModel):
    id: uuid.UUID
    email: str | None
    phone: str | None
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime
    appointments_count: int
    upcoming_count: int
    completed_count: int
    cancelled_count: int
    last_appointment_at: datetime | None


class AdminUserAppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    doctor_user_id: uuid.UUID
    doctor_display_name: str | None
    start_at: datetime
    end_at: datetime
    timezone: str
    status: AppointmentStatus
    meeting_link: str | None
    notes: str | None
    created_at: datetime


class AdminUserDetailOut(BaseModel):
    user: UserOut
    appointments_count: int
    upcoming_count: int
    completed_count: int
    cancelled_count: int
    last_appointment_at: datetime | None
    appointments: list[AdminUserAppointmentOut]
