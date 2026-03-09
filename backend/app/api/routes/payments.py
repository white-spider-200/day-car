import uuid

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import Payment, User, UserRole
from app.db.session import get_db
from app.schemas.payment import PaymentConfirmOut, PaymentInitIn, PaymentInitOut, PaymentOut
from app.services.payment_service import confirm_payment, handle_stripe_webhook, initialize_payment

router = APIRouter(tags=["payments"])


@router.post("/payments", response_model=PaymentInitOut)
def init_payment(
    payload: PaymentInitIn,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    payment, checkout_url, client_token, quote = initialize_payment(
        db,
        user=current_user,
        appointment_id=payload.appointment_id,
        method=payload.method,
        insurance_provider=payload.insurance_provider,
        package_sessions=payload.package_sessions,
    )
    return PaymentInitOut(
        payment=PaymentOut.model_validate(payment),
        checkout_url=checkout_url,
        client_token=client_token,
        quote=PaymentInitOut.PricingQuoteOut.model_validate(quote),
    )


@router.post("/payments/{payment_id}/confirm", response_model=PaymentConfirmOut)
def complete_payment(
    payment_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    payment = confirm_payment(db, payment_id=payment_id, actor_user=current_user)
    return PaymentConfirmOut(payment=PaymentOut.model_validate(payment), appointment_fee_paid=True)


@router.post("/payments/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    payload = await request.body()
    return handle_stripe_webhook(db, payload=payload, signature=stripe_signature)


@router.get("/payments/my", response_model=list[PaymentOut])
def list_my_payments(
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    rows = list(
        db.scalars(select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()))
    )
    return [PaymentOut.model_validate(item) for item in rows]
