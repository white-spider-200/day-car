import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.models import Payment, User, UserRole
from app.db.session import get_db
from app.schemas.payment import PaymentConfirmOut, PaymentInitIn, PaymentInitOut, PaymentOut
from app.services.payment_service import confirm_payment, initialize_payment

router = APIRouter(tags=["payments"])


@router.post("/payments", response_model=PaymentInitOut)
def init_payment(
    payload: PaymentInitIn,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    payment, checkout_url, client_token = initialize_payment(
        db,
        user=current_user,
        appointment_id=payload.appointment_id,
        amount=payload.amount,
        method=payload.method,
        insurance_provider=payload.insurance_provider,
    )
    return PaymentInitOut(
        payment=PaymentOut.model_validate(payment),
        checkout_url=checkout_url,
        client_token=client_token,
    )


@router.post("/payments/{payment_id}/confirm", response_model=PaymentConfirmOut)
def complete_payment(
    payment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = confirm_payment(db, payment_id=payment_id, actor_user=current_user)
    return PaymentConfirmOut(payment=PaymentOut.model_validate(payment), appointment_fee_paid=True)


@router.get("/payments/my", response_model=list[PaymentOut])
def list_my_payments(
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    rows = list(
        db.scalars(select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()))
    )
    return [PaymentOut.model_validate(item) for item in rows]
