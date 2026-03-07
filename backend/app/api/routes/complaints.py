import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import Complaint, ComplaintStatus, User, UserRole
from app.db.session import get_db
from app.schemas.complaint import AdminComplaintOut, ComplaintCreateIn, ComplaintOut

router = APIRouter(tags=["complaints"])


@router.post("/complaints", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: ComplaintCreateIn,
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    complaint = Complaint(
        reporter_user_id=current_user.id,
        reporter_role=current_user.role,
        subject=payload.subject.strip() if payload.subject else None,
        text=payload.text.strip(),
        status=ComplaintStatus.NEW,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/complaints/my", response_model=list[ComplaintOut])
def list_my_complaints(
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    rows = list(
        db.scalars(
            select(Complaint)
            .where(Complaint.reporter_user_id == current_user.id)
            .order_by(Complaint.created_at.desc())
        )
    )
    return [ComplaintOut.model_validate(item) for item in rows]


@router.get("/admin/complaints", response_model=list[AdminComplaintOut])
def list_admin_complaints(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    rows = db.execute(
        select(Complaint, User)
        .join(User, User.id == Complaint.reporter_user_id)
        .order_by(Complaint.created_at.desc())
    ).all()

    return [
        AdminComplaintOut(
            id=complaint.id,
            reporter_user_id=complaint.reporter_user_id,
            reporter_role=complaint.reporter_role,
            reporter_email=reporter.email,
            reporter_name=reporter.name,
            subject=complaint.subject,
            text=complaint.text,
            status=complaint.status,
            created_at=complaint.created_at,
        )
        for complaint, reporter in rows
    ]


@router.patch("/admin/complaints/{complaint_id}/reviewed", response_model=ComplaintOut)
def mark_complaint_reviewed(
    complaint_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    complaint = db.scalar(select(Complaint).where(Complaint.id == complaint_id))
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    complaint.status = ComplaintStatus.REVIEWED
    db.commit()
    db.refresh(complaint)
    return complaint
