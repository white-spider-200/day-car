from decimal import Decimal

from pydantic import BaseModel, Field

from app.db.models import DocumentStatus


class RejectApplicationRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)


class ApproveApplicationRequest(BaseModel):
    note: str | None = Field(default=None, max_length=2000)


class RequestChangesRequest(BaseModel):
    notes: str = Field(min_length=3, max_length=2000)


class AdminApplicationNoteRequest(BaseModel):
    admin_note: str = Field(min_length=1, max_length=2000)


class SetDocumentStatusRequest(BaseModel):
    status: DocumentStatus
    comment: str | None = None


class TogglePublicRequest(BaseModel):
    is_public: bool


class UpdatePricingRequest(BaseModel):
    currency: str = Field(max_length=10)
    per_session: Decimal = Field(ge=0)
    notes: str | None = None
