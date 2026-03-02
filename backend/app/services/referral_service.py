from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Referral, ReferralStatus, User, UserRole
from app.services.notification_service import create_notification


def create_referral(
    db: Session,
    *,
    sender_doctor: User,
    receiver_doctor_id,
    patient_id,
    note: str | None,
) -> Referral:
    if sender_doctor.role != UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can create referrals")
    if sender_doctor.id == receiver_doctor_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot refer to yourself")

    referral = Referral(
        sender_doctor_id=sender_doctor.id,
        receiver_doctor_id=receiver_doctor_id,
        patient_id=patient_id,
        status=ReferralStatus.PENDING,
        note=note,
    )
    db.add(referral)
    db.flush()

    create_notification(
        db,
        user_id=receiver_doctor_id,
        event_type="REFERRAL_CREATED",
        title="New referral",
        body="A doctor sent you a referral.",
        metadata_json={"referral_id": str(referral.id), "patient_id": str(patient_id)},
    )
    db.commit()
    db.refresh(referral)
    return referral


def list_incoming_referrals(db: Session, *, doctor_user_id) -> list[Referral]:
    return list(
        db.scalars(
            select(Referral)
            .where(Referral.receiver_doctor_id == doctor_user_id)
            .order_by(Referral.created_at.desc())
        )
    )


def list_outgoing_referrals(db: Session, *, doctor_user_id) -> list[Referral]:
    return list(
        db.scalars(
            select(Referral)
            .where(Referral.sender_doctor_id == doctor_user_id)
            .order_by(Referral.created_at.desc())
        )
    )


def update_referral(
    db: Session,
    *,
    referral_id,
    actor_user: User,
    status_update: ReferralStatus,
    note: str | None,
) -> Referral:
    referral = db.scalar(select(Referral).where(Referral.id == referral_id))
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found")

    is_sender = referral.sender_doctor_id == actor_user.id
    is_receiver = referral.receiver_doctor_id == actor_user.id
    if actor_user.role != UserRole.ADMIN and not (is_sender or is_receiver):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this referral")

    referral.status = status_update
    if note is not None:
        referral.note = note
    db.flush()

    notify_target = referral.sender_doctor_id if is_receiver else referral.receiver_doctor_id
    create_notification(
        db,
        user_id=notify_target,
        event_type="REFERRAL_UPDATED",
        title="Referral updated",
        body=f"Referral status changed to {status_update.value}.",
        metadata_json={"referral_id": str(referral.id), "status": status_update.value},
    )
    db.commit()
    db.refresh(referral)
    return referral
