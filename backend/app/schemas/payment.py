import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import PaymentStatus


class PaymentInitIn(BaseModel):
    appointment_id: uuid.UUID
    amount: Decimal = Field(ge=0)
    method: str = Field(min_length=2, max_length=40)
    insurance_provider: str | None = Field(default=None, max_length=120)


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    appointment_id: uuid.UUID
    user_id: uuid.UUID
    amount: Decimal
    method: str
    insurance_provider: str | None
    status: PaymentStatus
    provider_reference: str | None
    created_at: datetime
    updated_at: datetime


class PaymentInitOut(BaseModel):
    payment: PaymentOut
    checkout_url: str
    client_token: str


class PaymentConfirmOut(BaseModel):
    payment: PaymentOut
    appointment_fee_paid: bool
