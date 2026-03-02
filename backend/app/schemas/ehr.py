import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import RecordEntryType


class PatientRecordCreateIn(BaseModel):
    user_id: uuid.UUID
    title: str = Field(default="Patient Record", min_length=2, max_length=255)


class PatientRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    doctor_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime


class RecordEntryCreateIn(BaseModel):
    entry_type: RecordEntryType
    content: str = Field(min_length=2, max_length=10000)


class RecordEntryUpdateIn(BaseModel):
    content: str = Field(min_length=2, max_length=10000)


class RecordEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    record_id: uuid.UUID
    entry_type: RecordEntryType
    content: str
    created_by_doctor_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RecordDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    record_id: uuid.UUID
    uploaded_by_doctor_id: uuid.UUID
    file_name: str
    content_type: str
    file_url: str
    created_at: datetime


class RecordDocumentSecureUrlOut(BaseModel):
    url: str
