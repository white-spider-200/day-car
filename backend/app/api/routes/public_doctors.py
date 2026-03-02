import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db.models import ApplicationStatus, DoctorApplication, DoctorProfile, User, UserStatus
from app.db.session import get_db
from app.schemas.availability import AvailabilitySlotOut
from app.schemas.doctor_profile import DoctorProfileListItem, DoctorProfileOut
from app.services.availability_service import generate_slots
from app.services.doctor_directory_service import getDoctorBySlug, getTopDoctor

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


def _online_session_clause():
    return or_(
        DoctorProfile.session_types.contains(["VIDEO"]),
        DoctorProfile.session_types.contains(["AUDIO"]),
        DoctorProfile.session_types.contains(["CHAT"]),
        DoctorProfile.session_types.contains(["ONLINE"]),
        DoctorProfile.session_types.contains(["Online"]),
    )


@router.get(
    "/doctors/top",
    response_model=DoctorProfileListItem | None,
    summary="Get top doctor",
    description="Returns one doctor marked as top doctor ordered by highest rating then latest update.",
)
def get_top_doctor(db: Session = Depends(get_db)):
    return getTopDoctor(db)


@router.get(
    "/doctors",
    response_model=list[DoctorProfileListItem],
    summary="List public therapists",
    description=(
        "Public therapist directory with therapy-specific filters.\n\n"
        "Examples:\n"
        "- `/doctors?specialty=CBT&city=Amman&session_type=VIDEO`\n"
        "- `/doctors?concern=Anxiety&approach=DBT&online_only=true`\n"
        "- `/doctors?insurance=MedNet&available_within_days=7&max_price=60`"
    ),
    responses={
        400: {
            "description": "Invalid filter combination",
            "content": {
                "application/json": {
                    "example": {"detail": "min_price must be <= max_price"}
                }
            },
        }
    },
)
def list_doctors(
    specialty: str | None = Query(
        default=None,
        description="Clinical specialty tag to match (exact list-item match).",
        openapi_examples={"cbt": {"summary": "CBT specialty", "value": "CBT"}},
    ),
    concern: str | None = Query(
        default=None,
        description="Primary concern/symptom tag (e.g., Anxiety, Depression, Trauma).",
        openapi_examples={"anxiety": {"summary": "Anxiety", "value": "Anxiety"}},
    ),
    approach: str | None = Query(
        default=None,
        description="Therapy approach tag (e.g., CBT, DBT, Psychodynamic, Mindfulness).",
        openapi_examples={"dbt": {"summary": "DBT approach", "value": "DBT"}},
    ),
    language: str | None = Query(
        default=None,
        description="Spoken language offered by therapist.",
        openapi_examples={"arabic": {"summary": "Arabic language", "value": "Arabic"}},
    ),
    session_type: str | None = Query(
        default=None,
        description="Session mode tag (e.g., VIDEO, IN_PERSON, CHAT, AUDIO).",
        openapi_examples={"video": {"summary": "Video sessions", "value": "VIDEO"}},
    ),
    city: str | None = Query(
        default=None,
        description='City filter (or use value "online" to return online-capable therapists).',
        openapi_examples={"amman": {"summary": "Amman city", "value": "Amman"}},
    ),
    gender: str | None = Query(
        default=None,
        description="Therapist gender identity.",
        openapi_examples={"female": {"summary": "Female therapist", "value": "Female"}},
    ),
    insurance: str | None = Query(
        default=None,
        description="Insurance provider accepted by the therapist.",
        openapi_examples={"mednet": {"summary": "MedNet coverage", "value": "MedNet"}},
    ),
    min_price: float | None = Query(
        default=None,
        ge=0,
        description="Minimum session price.",
        openapi_examples={"min50": {"summary": "Minimum 50", "value": 50}},
    ),
    max_price: float | None = Query(
        default=None,
        ge=0,
        description="Maximum session price.",
        openapi_examples={"max100": {"summary": "Maximum 100", "value": 100}},
    ),
    available_within_days: int | None = Query(
        default=None,
        ge=1,
        le=90,
        description="Only therapists with next availability within this many days.",
        openapi_examples={"week": {"summary": "Available this week", "value": 7}},
    ),
    online_only: bool | None = Query(
        default=None,
        description="When true, only therapists with online-capable session types are returned.",
        openapi_examples={"online": {"summary": "Only online", "value": True}},
    ),
    db: Session = Depends(get_db),
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="min_price must be <= max_price")

    query = _base_public_query()

    if specialty:
        query = query.where(DoctorProfile.specialties.contains([specialty]))
    if concern:
        query = query.where(DoctorProfile.concerns.contains([concern]))
    if approach:
        query = query.where(DoctorProfile.therapy_approaches.contains([approach]))
    if language:
        query = query.where(DoctorProfile.languages.contains([language]))
    if session_type:
        normalized = session_type.strip().upper()
        query = query.where(
            or_(
                DoctorProfile.session_types.contains([session_type]),
                DoctorProfile.session_types.contains([normalized]),
            )
        )
    if city:
        if city.strip().lower() == "online":
            query = query.where(_online_session_clause())
        else:
            query = query.where(DoctorProfile.location_city.ilike(f"%{city}%"))
    if gender:
        query = query.where(DoctorProfile.gender_identity.is_not(None))
        query = query.where(DoctorProfile.gender_identity.ilike(gender.strip()))
    if insurance:
        query = query.where(DoctorProfile.insurance_providers.contains([insurance]))
    if min_price is not None:
        query = query.where(DoctorProfile.pricing_per_session >= min_price)
    if max_price is not None:
        query = query.where(DoctorProfile.pricing_per_session <= max_price)
    if available_within_days is not None:
        now = datetime.now(UTC)
        cutoff = now + timedelta(days=available_within_days)
        query = query.where(DoctorProfile.next_available_at.is_not(None))
        query = query.where(DoctorProfile.next_available_at >= now)
        query = query.where(DoctorProfile.next_available_at <= cutoff)
    if online_only:
        query = query.where(_online_session_clause())

    profiles = list(
        db.scalars(
            query.order_by(
                DoctorProfile.is_top_doctor.desc(),
                DoctorProfile.rating.desc().nullslast(),
                DoctorProfile.created_at.desc(),
            )
        )
    )
    return profiles


@router.get("/doctors/slug/{slug}", response_model=DoctorProfileOut)
def get_doctor_profile_by_slug(slug: str, db: Session = Depends(get_db)):
    profile = getDoctorBySlug(db, slug)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return profile


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
