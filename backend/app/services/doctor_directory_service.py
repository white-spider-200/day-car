from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ApplicationStatus, DoctorApplication, DoctorProfile, User, UserStatus


def _public_profile_query():
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


def get_top_doctor(db: Session) -> DoctorProfile | None:
    query = _public_profile_query().where(DoctorProfile.is_top_doctor.is_(True))
    query = query.order_by(DoctorProfile.rating.desc().nullslast(), DoctorProfile.updated_at.desc())
    return db.scalar(query)


def get_doctor_by_slug(db: Session, slug: str) -> DoctorProfile | None:
    normalized = slug.strip().lower()
    if not normalized:
        return None
    query = _public_profile_query().where(DoctorProfile.slug == normalized)
    return db.scalar(query)


def filter_doctors(db: Session, *, specialty: str | None = None, public_only: bool = True) -> list[DoctorProfile]:
    query = _public_profile_query() if public_only else select(DoctorProfile)
    if specialty:
        query = query.where(DoctorProfile.specialties.contains([specialty]))
    return list(db.scalars(query.order_by(DoctorProfile.display_name.asc())))


# Compatibility helpers matching requested names.
def getTopDoctor(db: Session) -> DoctorProfile | None:
    return get_top_doctor(db)


def getDoctorBySlug(db: Session, slug: str) -> DoctorProfile | None:
    return get_doctor_by_slug(db, slug)
