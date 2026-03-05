from __future__ import annotations

import secrets
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import (
    Appointment,
    AppointmentCallStatus,
    DoctorProfile,
    Payment,
    PaymentStatus,
    User,
    UserRole,
)


DISCOUNT_RATE = Decimal("0.20")
FALLBACK_BASE_PRICE = Decimal("40.00")


def _to_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _build_package_quote(*, base_price: Decimal, package_sessions: int, currency: str) -> dict:
    rate_factor = Decimal("1.00") - DISCOUNT_RATE
    session_prices: list[Decimal] = []
    current = base_price
    for _ in range(package_sessions):
        session_prices.append(_to_money(current))
        current *= rate_factor
    original_total = _to_money(base_price * Decimal(package_sessions))
    discounted_total = _to_money(sum(session_prices, Decimal("0.00")))
    total_savings = _to_money(original_total - discounted_total)
    return {
        "package_sessions": package_sessions,
        "discount_percent": _to_money(DISCOUNT_RATE * Decimal("100")),
        "base_session_price": _to_money(base_price),
        "currency": currency,
        "original_total": original_total,
        "discounted_total": discounted_total,
        "total_savings": total_savings,
        "session_prices": session_prices,
    }


def initialize_payment(
    db: Session,
    *,
    user: User,
    appointment_id,
    method: str,
    insurance_provider: str | None,
    package_sessions: int,
) -> tuple[Payment, str, str, dict]:
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id))
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if appointment.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot pay for this appointment")
    if appointment.fee_paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment fee is already paid")
    if package_sessions < 1 or package_sessions > 6:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="package_sessions must be between 1 and 6")

    doctor_profile = db.scalar(
        select(DoctorProfile).where(DoctorProfile.doctor_user_id == appointment.doctor_user_id)
    )
    base_price = (
        Decimal(doctor_profile.pricing_per_session)
        if doctor_profile and doctor_profile.pricing_per_session is not None
        else FALLBACK_BASE_PRICE
    )
    currency = doctor_profile.pricing_currency if doctor_profile and doctor_profile.pricing_currency else "JOD"
    quote = _build_package_quote(
        base_price=_to_money(base_price),
        package_sessions=package_sessions,
        currency=currency,
    )

    payment = Payment(
        appointment_id=appointment.id,
        user_id=user.id,
        amount=quote["discounted_total"],
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
    return payment, checkout_url, client_token, quote


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


def doctor_financial_summary(
    db: Session,
    *,
    doctor_user_id,
) -> dict:
    profile = db.scalar(select(DoctorProfile).where(DoctorProfile.doctor_user_id == doctor_user_id))
    currency = profile.pricing_currency if profile and profile.pricing_currency else "JOD"

    paid_amount = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .join(Appointment, Appointment.id == Payment.appointment_id)
        .where(
            Appointment.doctor_user_id == doctor_user_id,
            Payment.status == PaymentStatus.PAID,
        )
    ) or Decimal("0.00")

    pending_amount = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .join(Appointment, Appointment.id == Payment.appointment_id)
        .where(
            Appointment.doctor_user_id == doctor_user_id,
            Payment.status == PaymentStatus.PENDING,
        )
    ) or Decimal("0.00")

    paid_count = db.scalar(
        select(func.count(Payment.id))
        .join(Appointment, Appointment.id == Payment.appointment_id)
        .where(
            Appointment.doctor_user_id == doctor_user_id,
            Payment.status == PaymentStatus.PAID,
        )
    ) or 0

    pending_count = db.scalar(
        select(func.count(Payment.id))
        .join(Appointment, Appointment.id == Payment.appointment_id)
        .where(
            Appointment.doctor_user_id == doctor_user_id,
            Payment.status == PaymentStatus.PENDING,
        )
    ) or 0

    fee_percent = _to_money(Decimal(settings.sabina_platform_fee_percent))
    sabina_share = _to_money(_to_money(Decimal(paid_amount)) * fee_percent / Decimal("100"))
    doctor_net = _to_money(_to_money(Decimal(paid_amount)) - sabina_share)

    return {
        "currency": currency,
        "platform_fee_percent": fee_percent,
        "total_paid_amount": _to_money(Decimal(paid_amount)),
        "sabina_share_amount": sabina_share,
        "doctor_net_amount": doctor_net,
        "pending_amount": _to_money(Decimal(pending_amount)),
        "paid_payments_count": int(paid_count),
        "pending_payments_count": int(pending_count),
    }
