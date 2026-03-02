import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import ProfileUpdateStatus, User, UserRole
from app.db.session import get_db
from app.schemas.profile_update_request import (
    ProfileUpdateRequestIn,
    ProfileUpdateRequestOut,
    ProfileUpdateReviewIn,
)
from app.services.profile_update_service import (
    list_my_profile_update_requests,
    list_profile_update_requests_for_admin,
    review_profile_update_request,
    submit_profile_update_request,
)

router = APIRouter(tags=["profile-updates"])


@router.post("/doctor/profile-updates", response_model=ProfileUpdateRequestOut)
def submit_update(
    payload: ProfileUpdateRequestIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    item = submit_profile_update_request(db, doctor_user=current_user, payload_json=payload.payload_json)
    return ProfileUpdateRequestOut.model_validate(item)


@router.get("/doctor/profile-updates", response_model=list[ProfileUpdateRequestOut])
def list_my_updates(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    rows = list_my_profile_update_requests(db, doctor_user=current_user)
    return [ProfileUpdateRequestOut.model_validate(item) for item in rows]


@router.get("/admin/profile-updates", response_model=list[ProfileUpdateRequestOut])
def list_updates_for_admin(
    status_filter: ProfileUpdateStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    _ = current_user
    rows = list_profile_update_requests_for_admin(db, status_filter=status_filter)
    return [ProfileUpdateRequestOut.model_validate(item) for item in rows]


@router.patch("/admin/profile-updates/{request_id}", response_model=ProfileUpdateRequestOut)
def review_update(
    request_id: uuid.UUID,
    payload: ProfileUpdateReviewIn,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    item = review_profile_update_request(
        db,
        request_id=request_id,
        admin_user=current_user,
        status_update=payload.status,
        admin_note=payload.admin_note,
    )
    return ProfileUpdateRequestOut.model_validate(item)
