import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.referral import ReferralCreateIn, ReferralOut, ReferralUpdateIn
from app.services.referral_service import (
    create_referral,
    list_incoming_referrals,
    list_outgoing_referrals,
    update_referral,
)

router = APIRouter(tags=["referrals"])


@router.post("/referrals", response_model=ReferralOut)
def create_referral_item(
    payload: ReferralCreateIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    item = create_referral(
        db,
        sender_doctor=current_user,
        receiver_doctor_id=payload.receiver_doctor_id,
        patient_id=payload.patient_id,
        note=payload.note,
    )
    return ReferralOut.model_validate(item)


@router.get("/doctor/referrals/incoming", response_model=list[ReferralOut])
def incoming_referrals(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    rows = list_incoming_referrals(db, doctor_user_id=current_user.id)
    return [ReferralOut.model_validate(item) for item in rows]


@router.get("/doctor/referrals/outgoing", response_model=list[ReferralOut])
def outgoing_referrals(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    rows = list_outgoing_referrals(db, doctor_user_id=current_user.id)
    return [ReferralOut.model_validate(item) for item in rows]


@router.patch("/referrals/{referral_id}", response_model=ReferralOut)
def patch_referral(
    referral_id: uuid.UUID,
    payload: ReferralUpdateIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    item = update_referral(
        db,
        referral_id=referral_id,
        actor_user=current_user,
        status_update=payload.status,
        note=payload.note,
    )
    return ReferralOut.model_validate(item)
