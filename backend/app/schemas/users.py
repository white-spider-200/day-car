import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.db.models import UserRole, UserStatus


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    phone: str | None
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime
