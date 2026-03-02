from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.db.models import Payment, PaymentStatus


def _window_bounds(from_date: date, to_date: date) -> tuple[datetime, datetime]:
    start_at = datetime.combine(from_date, time.min, tzinfo=UTC)
    end_at = datetime.combine(to_date + timedelta(days=1), time.min, tzinfo=UTC)
    return start_at, end_at


def build_financial_report(
    db: Session,
    *,
    from_date: date,
    to_date: date,
    granularity: str,
) -> dict:
    start_at, end_at = _window_bounds(from_date, to_date)
    period_expr = func.date_trunc("month" if granularity == "monthly" else "day", Payment.created_at)

    rows = db.execute(
        select(
            period_expr.label("period"),
            func.coalesce(func.sum(Payment.amount), 0).label("total_amount"),
            func.count(case((Payment.status == PaymentStatus.PAID, 1))).label("paid_count"),
            func.count(case((Payment.status == PaymentStatus.PENDING, 1))).label("pending_count"),
            func.count(case((Payment.status == PaymentStatus.FAILED, 1))).label("failed_count"),
        )
        .where(Payment.created_at >= start_at, Payment.created_at < end_at)
        .group_by(period_expr)
        .order_by(period_expr)
    ).all()

    insurance_rows = db.execute(
        select(
            func.coalesce(Payment.insurance_provider, "SELF_PAY").label("insurance_provider"),
            func.coalesce(func.sum(Payment.amount), 0).label("total_amount"),
            func.count(Payment.id).label("payments_count"),
        )
        .where(Payment.created_at >= start_at, Payment.created_at < end_at)
        .group_by(Payment.insurance_provider)
        .order_by(func.coalesce(func.sum(Payment.amount), 0).desc())
    ).all()

    total_amount = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.created_at >= start_at, Payment.created_at < end_at
        )
    )

    return {
        "from_date": from_date,
        "to_date": to_date,
        "granularity": granularity,
        "total_amount": Decimal(total_amount or 0),
        "rows": [
            {
                "period": row.period.strftime("%Y-%m-%d"),
                "total_amount": Decimal(row.total_amount or 0),
                "paid_count": int(row.paid_count or 0),
                "pending_count": int(row.pending_count or 0),
                "failed_count": int(row.failed_count or 0),
            }
            for row in rows
        ],
        "insurance_breakdown": [
            {
                "insurance_provider": row.insurance_provider or "SELF_PAY",
                "total_amount": Decimal(row.total_amount or 0),
                "payments_count": int(row.payments_count or 0),
            }
            for row in insurance_rows
        ],
    }
