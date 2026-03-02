from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class FinancialReportRequest(BaseModel):
    from_date: date
    to_date: date
    granularity: str = Field(default="daily", pattern="^(daily|monthly)$")


class FinancialAggregateItem(BaseModel):
    period: str
    total_amount: Decimal
    paid_count: int
    pending_count: int
    failed_count: int


class InsuranceBreakdownItem(BaseModel):
    insurance_provider: str
    total_amount: Decimal
    payments_count: int


class FinancialReportOut(BaseModel):
    from_date: date
    to_date: date
    granularity: str
    total_amount: Decimal
    rows: list[FinancialAggregateItem]
    insurance_breakdown: list[InsuranceBreakdownItem]
