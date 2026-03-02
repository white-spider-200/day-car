from __future__ import annotations

import secrets

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    Appointment,
    AppointmentCallStatus,
    Payment,
    PaymentStatus,
    User,
    UserRole,
)


def initialize_payment(
    db: Session,
    *,
    user: User,
    appointment_id,
    amount,
    method: str,
    insurance_provider: str | None,
) -> tuple[Payment, str, str]:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if appointment.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot pay for this appointment")
    if appointment.fee_paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment fee is already paid")

    payment = Payment(
        appointment_id=appointment.id,
        user_id=user.id,
        amount=amount,
        method=method.strip().upper(),
        insurance_provider=insurance_provider,
        status=PaymentStatus.PENDING,
        provider_reference=f"pay_{secrets.token_hex(10)}",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Provider-agnostic local checkout URL/token contract.
    client_token = secrets.token_urlsafe(24)
    checkout_url = f"/dashboard?payment_id={payment.id}&client_token={client_token}"
    return payment, checkout_url, client_token


def confirm_payment(
    db: Session,
    *,
    payment_id,
    actor_user: User,
) -> Payment:
    payment = db.scalar(select(Payment).where(Payment.id == payment_id))
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.user_id != actor_user.id and actor_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to confirm this payment")

    payment.status = PaymentStatus.PAID

    appointment = db.scalar(select(Appointment).where(Appointment.id == payment.appointment_id))
    if appointment:
        appointment.fee_paid = True
        if appointment.call_status == AppointmentCallStatus.NOT_READY:
            appointment.call_status = AppointmentCallStatus.READY

    db.commit()
    db.refresh(payment)
    return payment
