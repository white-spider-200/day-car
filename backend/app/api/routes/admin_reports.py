from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.financial_report import FinancialReportOut
from app.services.reports_service import build_financial_report

router = APIRouter(tags=["admin-reports"])


def _build_csv(report: dict) -> str:
    lines = ["period,total_amount,paid_count,pending_count,failed_count"]
    for row in report["rows"]:
        lines.append(
            f'{row["period"]},{row["total_amount"]},{row["paid_count"]},{row["pending_count"]},{row["failed_count"]}'
        )
    lines.append("")
    lines.append("insurance_provider,total_amount,payments_count")
    for row in report["insurance_breakdown"]:
        lines.append(f'{row["insurance_provider"]},{row["total_amount"]},{row["payments_count"]}')
    return "\n".join(lines)


@router.get("/admin/financial-reports", response_model=FinancialReportOut)
def get_financial_reports(
    from_date: date = Query(...),
    to_date: date = Query(...),
    granularity: str = Query(default="daily", pattern="^(daily|monthly)$"),
    output: str = Query(default="json", pattern="^(json|csv)$"),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    report = build_financial_report(
        db,
        from_date=from_date,
        to_date=to_date,
        granularity=granularity,
    )
    if output == "csv":
        content = _build_csv(report)
        return PlainTextResponse(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=financial_report.csv"},
        )
    return FinancialReportOut.model_validate(report)
