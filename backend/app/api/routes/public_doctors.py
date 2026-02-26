import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ApplicationStatus, DoctorApplication, DoctorProfile, User, UserStatus
from app.db.session import get_db
from app.schemas.availability import AvailabilitySlotOut
from app.schemas.doctor_profile import DoctorProfileListItem, DoctorProfileOut
from app.services.availability_service import generate_slots

router = APIRouter(tags=["public"])


def _base_public_query():
    return (
        select(DoctorProfile)
        .join(User, User.id == DoctorProfile.doctor_user_id)
        .join(DoctorApplication, DoctorApplication.doctor_user_id == DoctorProfile.doctor_user_id)
        .where(
            DoctorProfile.is_public.is_(True),
            User.status == UserStatus.ACTIVE,
            DoctorApplication.status == ApplicationStatus.APPROVED,
        )
    )


@router.get("/doctors", response_model=list[DoctorProfileListItem])
def list_doctors(
    specialty: str | None = Query(default=None),
    language: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    city: str | None = Query(default=None),
    session_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = _base_public_query()

    if specialty:
        query = query.where(DoctorProfile.specialties.contains([specialty]))
    if language:
        query = query.where(DoctorProfile.languages.contains([language]))
    if session_type:
        query = query.where(DoctorProfile.session_types.contains([session_type]))
    if city:
        query = query.where(DoctorProfile.location_city.ilike(f"%{city}%"))
    if min_price is not None:
        query = query.where(DoctorProfile.pricing_per_session >= min_price)
    if max_price is not None:
        query = query.where(DoctorProfile.pricing_per_session <= max_price)

    profiles = list(db.scalars(query.order_by(DoctorProfile.created_at.desc())))
    return profiles


@router.get("/doctors/{doctor_user_id}", response_model=DoctorProfileOut)
def get_doctor_profile(doctor_user_id: uuid.UUID, db: Session = Depends(get_db)):
    profile = db.scalar(_base_public_query().where(DoctorProfile.doctor_user_id == doctor_user_id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return profile


@router.get("/doctors/{doctor_user_id}/availability", response_model=list[AvailabilitySlotOut])
def get_doctor_availability(
    doctor_user_id: uuid.UUID,
    date_from: date,
    date_to: date,
    db: Session = Depends(get_db),
):
    if date_to < date_from:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="date_to must be >= date_from")
    if (date_to - date_from).days > 60:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="date range too large")

    profile = db.scalar(_base_public_query().where(DoctorProfile.doctor_user_id == doctor_user_id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    return generate_slots(db, doctor_user_id=doctor_user_id, date_from=date_from, date_to=date_to)
