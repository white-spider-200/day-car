import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.prescription import PrescriptionCreateIn, PrescriptionOut, PrescriptionVerifyOut
from app.services.prescription_service import create_prescription, list_doctor_prescriptions, verify_prescription

router = APIRouter(tags=["prescriptions"])


@router.post("/doctor/prescriptions", response_model=PrescriptionOut)
def create_doctor_prescription(
    payload: PrescriptionCreateIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    row, verification_url, qr_data_url = create_prescription(db, doctor_user=current_user, payload=payload)
    body = PrescriptionOut.model_validate(row).model_dump()
    body["verification_url"] = verification_url
    body["verification_qr_data_url"] = qr_data_url
    return PrescriptionOut.model_validate(body)


@router.get("/doctor/prescriptions", response_model=list[PrescriptionOut])
def list_my_doctor_prescriptions(
    user_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    rows = list_doctor_prescriptions(db, doctor_user=current_user, user_id=user_id)
    output: list[PrescriptionOut] = []
    for row in rows:
        body = PrescriptionOut.model_validate(row).model_dump()
        body["verification_url"] = ""
        body["verification_qr_data_url"] = ""
        output.append(PrescriptionOut.model_validate(body))
    return output


@router.get("/prescriptions/verify/{prescription_id}", response_model=PrescriptionVerifyOut)
def verify_by_qr(
    prescription_id: uuid.UUID,
    code: str = Query(..., min_length=5, max_length=120),
    db: Session = Depends(get_db),
):
    payload = verify_prescription(db, prescription_id=prescription_id, code=code.strip())
    return PrescriptionVerifyOut.model_validate(payload)

