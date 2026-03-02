import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.notification import NotificationMarkReadOut, NotificationOut
from app.services.notification_service import list_notifications, mark_notifications_read

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=list[NotificationOut])
def get_notifications(
    limit: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = list_notifications(db, user_id=current_user.id, limit=limit)
    return [NotificationOut.model_validate(item) for item in rows]


@router.post("/notifications/read", response_model=NotificationMarkReadOut)
def mark_read(
    notification_ids: list[uuid.UUID] | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    marked = mark_notifications_read(
        db,
        user_id=current_user.id,
        notification_ids=notification_ids,
    )
    return NotificationMarkReadOut(marked=marked)
