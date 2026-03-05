from decimal import Decimal

from pydantic import BaseModel


class DoctorFinancialSummaryOut(BaseModel):
    currency: str
    platform_fee_percent: Decimal
    total_paid_amount: Decimal
    sabina_share_amount: Decimal
    doctor_net_amount: Decimal
    pending_amount: Decimal
    paid_payments_count: int
    pending_payments_count: int
