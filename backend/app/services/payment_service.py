from __future__ import annotations

import secrets
import uuid
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


def _to_stripe_amount(value: Decimal, currency: str) -> int:
    normalized_currency = currency.strip().lower()
    exponent = 3 if normalized_currency in {"bhd", "jod", "kwd", "omr", "tnd"} else 2
    return int((value * (Decimal(10) ** exponent)).to_integral_value(rounding=ROUND_HALF_UP))


def _payment_provider() -> str:
    return (settings.payment_provider or "").strip().upper()


def _public_payment_url(path: str) -> str:
    base = settings.payment_public_base_url.rstrip("/")
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{base}{normalized_path}"


def _get_stripe_module():
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured on the server",
        )
    try:
        import stripe
    except ModuleNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe SDK is not installed on the server",
        ) from exc

    stripe.api_key = settings.stripe_secret_key
    return stripe


def _create_stripe_checkout_session(*, payment: Payment, quote: dict, user: User):
    stripe = _get_stripe_module()
    success_url = _public_payment_url(f"/dashboard?payment_status=success&payment_id={payment.id}")
    cancel_url = _public_payment_url(f"/booking/confirm?payment_status=cancelled&payment_id={payment.id}")
    return stripe.checkout.Session.create(
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=str(payment.id),
        customer_email=user.email,
        metadata={
            "payment_id": str(payment.id),
            "appointment_id": str(payment.appointment_id),
            "user_id": str(user.id),
            "method": payment.method,
            "insurance_provider": payment.insurance_provider or "",
            "currency": quote["currency"],
            "package_sessions": str(quote["package_sessions"]),
        },
        line_items=[
            {
                "quantity": 1,
                "price_data": {
                    "currency": quote["currency"].lower(),
                    "unit_amount": _to_stripe_amount(quote["discounted_total"], quote["currency"]),
                    "product_data": {
                        "name": f"Sabina therapy package ({quote['package_sessions']} session{'s' if quote['package_sessions'] != 1 else ''})",
                        "description": f"Appointment {payment.appointment_id}",
                    },
                },
            }
        ],
    )


def _construct_stripe_event(*, payload: bytes, signature: str):
    webhook_secret = settings.stripe_webhook_secret or settings.payment_webhook_secret
    if not webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook secret is not configured on the server",
        )
    stripe = _get_stripe_module()
    return stripe.Webhook.construct_event(payload=payload, sig_header=signature, secret=webhook_secret)


def _payment_by_reference_or_metadata(db: Session, provider_reference: str | None, payment_id: str | None) -> Payment | None:
    if provider_reference:
        payment = db.scalar(select(Payment).where(Payment.provider_reference == provider_reference))
        if payment:
            return payment
    if payment_id:
        try:
            parsed_payment_id = uuid.UUID(payment_id)
        except ValueError:
            return None
        return db.scalar(select(Payment).where(Payment.id == parsed_payment_id))
    return None


def _apply_paid_state(db: Session, payment: Payment) -> Payment:
    payment.status = PaymentStatus.PAID

    appointment = db.scalar(select(Appointment).where(Appointment.id == payment.appointment_id))
    if appointment:
        appointment.fee_paid = True
        if appointment.call_status == AppointmentCallStatus.NOT_READY:
            appointment.call_status = AppointmentCallStatus.READY

    db.commit()
    db.refresh(payment)
    return payment


def _apply_failed_state(db: Session, payment: Payment) -> Payment:
    payment.status = PaymentStatus.FAILED
    db.commit()
    db.refresh(payment)
    return payment


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
    provider = _payment_provider()
    if provider != "STRIPE":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unsupported payment provider: {provider or 'UNSET'}",
        )

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
    )
    db.add(payment)
    db.flush()

    checkout_session = _create_stripe_checkout_session(payment=payment, quote=quote, user=user)
    payment.provider_reference = checkout_session.id
    db.commit()
    db.refresh(payment)

    checkout_url = checkout_session.url
    client_token = checkout_session.id or secrets.token_urlsafe(24)
    return payment, checkout_url, client_token, quote


def confirm_payment(
    db: Session,
    *,
    payment_id,
    actor_user: User,
) -> Payment:
    if actor_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payments are confirmed by Stripe webhooks only",
        )

    payment = db.scalar(select(Payment).where(Payment.id == payment_id))
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    return _apply_paid_state(db, payment)


def handle_stripe_webhook(db: Session, *, payload: bytes, signature: str) -> dict:
    event = _construct_stripe_event(payload=payload, signature=signature)
    event_type = event["type"]
    event_object = event["data"]["object"]

    payment = _payment_by_reference_or_metadata(
        db,
        provider_reference=event_object.get("id"),
        payment_id=(event_object.get("metadata") or {}).get("payment_id") or event_object.get("client_reference_id"),
    )
    if not payment:
        return {"received": True, "event_type": event_type, "payment_found": False}

    if event_type == "checkout.session.completed":
        if payment.status != PaymentStatus.PAID:
            _apply_paid_state(db, payment)
    elif event_type in {"checkout.session.async_payment_failed", "checkout.session.expired"}:
        if payment.status != PaymentStatus.PAID:
            _apply_failed_state(db, payment)

    return {"received": True, "event_type": event_type, "payment_found": True}


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
