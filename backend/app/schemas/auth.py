from pydantic import BaseModel, EmailStr, Field, TypeAdapter, field_validator, model_validator
from typing import Optional
from app.db.models import UserRole

email_adapter = TypeAdapter(EmailStr)


def normalize_email_allow_local(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    normalized = value.strip().lower()
    if not normalized:
        return None

    if normalized.endswith(".local"):
        local_part, _, domain_part = normalized.rpartition("@")
        if not local_part or not domain_part or " " in local_part or " " in domain_part:
            raise ValueError("Invalid email format")
        return normalized

    email_adapter.validate_python(normalized)
    return normalized


class RegisterRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{1,14}$")
    password: str = Field(min_length=8, max_length=128)
    role: UserRole

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        return normalize_email_allow_local(value)

    @model_validator(mode='after')
    def check_id_provided(self):
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self


class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        return normalize_email_allow_local(value)

    @model_validator(mode='after')
    def check_id_provided(self):
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self


class GoogleLoginRequest(BaseModel):
    id_token: str


class RequestLoginCodeRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{1,14}$")

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        return normalize_email_allow_local(value)

    @model_validator(mode='after')
    def check_id_provided(self):
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self


class VerifyLoginCodeRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{1,14}$")
    code: str = Field(min_length=4, max_length=10)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        return normalize_email_allow_local(value)

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        sanitized = value.strip()
        if not sanitized.isdigit():
            raise ValueError("Code must contain digits only")
        return sanitized

    @model_validator(mode='after')
    def check_id_provided(self):
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        return self


class RequestLoginCodeResponse(BaseModel):
    message: str
    delivery_channel: str
    expires_in_seconds: int
    debug_code: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
