import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models import DocumentStatus, DocumentType


class DoctorDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    application_id: uuid.UUID
    type: DocumentType
    file_url: str
    status: DocumentStatus
    admin_comment: str | None
    uploaded_at: datetime
