import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.ehr import (
    PatientRecordCreateIn,
    PatientRecordOut,
    RecordDocumentOut,
    RecordDocumentSecureUrlOut,
    RecordEntryCreateIn,
    RecordEntryOut,
    RecordEntryUpdateIn,
)
from app.services.ehr_service import (
    create_document_download_token,
    create_patient_record,
    create_record_entry,
    get_record_for_actor,
    list_doctor_records,
    list_patient_records,
    list_record_documents,
    list_record_entries,
    update_record_entry,
    upload_record_document,
    verify_document_download_access,
)

router = APIRouter(tags=["ehr"])


@router.post("/doctor/patient-records", response_model=PatientRecordOut)
def create_record(
    payload: PatientRecordCreateIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    record = create_patient_record(db, doctor_user=current_user, user_id=payload.user_id, title=payload.title)
    return PatientRecordOut.model_validate(record)


@router.get("/doctor/patient-records", response_model=list[PatientRecordOut])
def list_doctor_patient_records(
    user_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    rows = list_doctor_records(db, doctor_user=current_user, user_id=user_id)
    return [PatientRecordOut.model_validate(item) for item in rows]


@router.get("/patient/records", response_model=list[PatientRecordOut])
def list_my_records(
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    rows = list_patient_records(db, patient_user=current_user)
    return [PatientRecordOut.model_validate(item) for item in rows]


@router.get("/records/{record_id}", response_model=PatientRecordOut)
def get_record(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = get_record_for_actor(db, record_id=record_id, actor_user=current_user)
    return PatientRecordOut.model_validate(record)


@router.get("/records/{record_id}/entries", response_model=list[RecordEntryOut])
def get_record_entries(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = get_record_for_actor(db, record_id=record_id, actor_user=current_user)
    rows = list_record_entries(db, record_id=record_id)
    return [RecordEntryOut.model_validate(item) for item in rows]


@router.post("/records/{record_id}/entries", response_model=RecordEntryOut)
def add_record_entry(
    record_id: uuid.UUID,
    payload: RecordEntryCreateIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    record = get_record_for_actor(db, record_id=record_id, actor_user=current_user)
    entry = create_record_entry(
        db,
        record=record,
        doctor_user=current_user,
        entry_type=payload.entry_type,
        content=payload.content,
    )
    return RecordEntryOut.model_validate(entry)


@router.patch("/records/{record_id}/entries/{entry_id}", response_model=RecordEntryOut)
def edit_record_entry(
    record_id: uuid.UUID,
    entry_id: uuid.UUID,
    payload: RecordEntryUpdateIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    _ = get_record_for_actor(db, record_id=record_id, actor_user=current_user)
    entry = update_record_entry(db, entry_id=entry_id, doctor_user=current_user, content=payload.content)
    return RecordEntryOut.model_validate(entry)


@router.get("/records/{record_id}/documents", response_model=list[RecordDocumentOut])
def get_record_docs(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = get_record_for_actor(db, record_id=record_id, actor_user=current_user)
    rows = list_record_documents(db, record_id=record_id)
    return [RecordDocumentOut.model_validate(item) for item in rows]


@router.post("/records/{record_id}/documents", response_model=RecordDocumentOut)
async def upload_doc(
    record_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    record = get_record_for_actor(db, record_id=record_id, actor_user=current_user)
    item = await upload_record_document(db, record=record, doctor_user=current_user, file=file)
    return RecordDocumentOut.model_validate(item)


@router.get("/records/documents/{document_id}/secure-url", response_model=RecordDocumentSecureUrlOut)
def get_doc_secure_url(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
):
    token = create_document_download_token(document_id=document_id, actor_user=current_user)
    return RecordDocumentSecureUrlOut(url=f"/records/documents/{document_id}/download?token={token}")


@router.get("/records/documents/{document_id}/download")
def download_doc(
    document_id: uuid.UUID,
    token: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = verify_document_download_access(
        db,
        document_id=document_id,
        token=token,
        actor_user=current_user,
    )
    return RedirectResponse(url=doc.file_url, status_code=307)
