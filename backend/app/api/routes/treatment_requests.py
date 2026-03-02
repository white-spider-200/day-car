import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.treatment_request import (
    TreatmentRequestCreateIn,
    TreatmentRequestOut,
    TreatmentRequestUpdateIn,
)
from app.services.treatment_request_service import (
    create_treatment_request,
    list_doctor_treatment_requests,
    update_treatment_request,
)

router = APIRouter(tags=["treatment-requests"])


@router.post("/treatment-requests", response_model=TreatmentRequestOut)
def create_request(
    payload: TreatmentRequestCreateIn,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    item = create_treatment_request(
        db,
        user=current_user,
        doctor_id=payload.doctor_id,
        message=payload.message,
    )
    return TreatmentRequestOut.model_validate(item)


@router.get("/doctor/treatment-requests", response_model=list[TreatmentRequestOut])
def list_incoming_requests(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    rows = list_doctor_treatment_requests(db, doctor_user_id=current_user.id)
    return [TreatmentRequestOut.model_validate(item) for item in rows]


@router.patch("/treatment-requests/{request_id}", response_model=TreatmentRequestOut)
def patch_request(
    request_id: uuid.UUID,
    payload: TreatmentRequestUpdateIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    item = update_treatment_request(
        db,
        request_id=request_id,
        doctor_user=current_user,
        status_update=payload.status,
        doctor_note=payload.doctor_note,
    )
    return TreatmentRequestOut.model_validate(item)
