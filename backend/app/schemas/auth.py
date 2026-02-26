from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional
from app.db.models import UserRole


class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{1,14}$")
    password: str = Field(min_length=8, max_length=128)
    role: UserRole

    @model_validator(mode='after')
    def check_id_provided(self):
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(min_length=8, max_length=128)

    @model_validator(mode='after')
    def check_id_provided(self):
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self


class GoogleLoginRequest(BaseModel):
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
