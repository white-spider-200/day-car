import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import DoctorProfile, User, UserRole
from app.db.session import get_db
from app.schemas.treatment_request import (
    TreatmentRequestCreateIn,
    TreatmentRequestOut,
    TreatmentRequestUpdateIn,
)
from app.services.treatment_request_service import (
    create_treatment_request,
    list_doctor_treatment_requests,
    list_user_treatment_requests,
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


@router.get("/treatment-requests/my", response_model=list[TreatmentRequestOut])
def list_my_requests(
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    rows = list_user_treatment_requests(db, user_id=current_user.id)
    if not rows:
        return []

    doctor_ids = [item.doctor_id for item in rows]
    doctor_name_rows = db.execute(
        select(DoctorProfile.doctor_user_id, DoctorProfile.display_name).where(DoctorProfile.doctor_user_id.in_(doctor_ids))
    ).all()
    doctor_names = {doctor_user_id: display_name for doctor_user_id, display_name in doctor_name_rows}

    payload: list[TreatmentRequestOut] = []
    for item in rows:
        row = TreatmentRequestOut.model_validate(item).model_dump()
        row["doctor_display_name"] = doctor_names.get(item.doctor_id)
        payload.append(TreatmentRequestOut.model_validate(row))
    return payload


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
