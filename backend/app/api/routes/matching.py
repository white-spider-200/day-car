from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db.models import APPROVED_APPLICATION_STATUSES, DoctorApplication, DoctorProfile, User, UserStatus
from app.db.session import get_db
from app.schemas.doctor_profile import DoctorProfileListItem
from app.services.doctor_matching_service import (
    APPROACH_QUESTION_IDS,
    CARE_QUESTION_IDS,
    SPECIALIZATION_QUESTION_IDS,
    derive_type_code,
    infer_doctor_type_code,
    rank_doctors,
)

router = APIRouter(prefix="/matching", tags=["public"])


class MatchingFiltersIn(BaseModel):
    gender: str | None = None
    language: str | None = None
    session_type: str | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    location: str | None = None
    insurance_provider: str | None = None


class MatchRequestIn(BaseModel):
    answers: dict[str, int]
    filters: MatchingFiltersIn | None = None

    @model_validator(mode="after")
    def validate_answers(self):
        required_ids = [*CARE_QUESTION_IDS, *APPROACH_QUESTION_IDS, *SPECIALIZATION_QUESTION_IDS]
        missing = [qid for qid in required_ids if qid not in self.answers]
        if missing:
            raise ValueError(f"Missing answers for: {', '.join(missing)}")

        for qid in required_ids:
            value = self.answers[qid]
            if value < 1 or value > 5:
                raise ValueError(f"Answer for {qid} must be between 1 and 5")

        return self


class AxisOut(BaseModel):
    letter: str
    primary_score: float
    opposite_score: float


class MatchDoctorOut(BaseModel):
    similarity: float
    doctor_type_code: str
    doctor: DoctorProfileListItem


class MatchResponseOut(BaseModel):
    user_type_code: str
    label: str
    axes: dict[str, AxisOut]
    doctors: list[MatchDoctorOut]


def _base_public_query():
    return (
        select(DoctorProfile)
        .join(User, User.id == DoctorProfile.doctor_user_id)
        .join(DoctorApplication, DoctorApplication.doctor_user_id == DoctorProfile.doctor_user_id)
        .where(
            DoctorProfile.is_public.is_(True),
            User.status == UserStatus.ACTIVE,
            DoctorApplication.status.in_(APPROVED_APPLICATION_STATUSES),
        )
    )


def _apply_filters(query, filters: MatchingFiltersIn | None):
    if not filters:
        return query

    if filters.min_price is not None and filters.max_price is not None and filters.min_price > filters.max_price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="min_price must be <= max_price")

    if filters.gender:
        query = query.where(DoctorProfile.gender_identity.is_not(None))
        query = query.where(DoctorProfile.gender_identity.ilike(filters.gender.strip()))

    if filters.language:
        query = query.where(DoctorProfile.languages.contains([filters.language]))

    if filters.session_type:
        normalized = filters.session_type.strip().upper()
        if normalized == "ONLINE":
            query = query.where(
                or_(
                    DoctorProfile.session_types.contains(["VIDEO"]),
                    DoctorProfile.session_types.contains(["AUDIO"]),
                    DoctorProfile.session_types.contains(["CHAT"]),
                    DoctorProfile.session_types.contains(["ONLINE"]),
                    DoctorProfile.session_types.contains(["Online"]),
                )
            )
        elif normalized == "CALL":
            query = query.where(
                or_(
                    DoctorProfile.session_types.contains(["AUDIO"]),
                    DoctorProfile.session_types.contains(["CALL"]),
                )
            )
        else:
            query = query.where(
                or_(
                    DoctorProfile.session_types.contains([filters.session_type]),
                    DoctorProfile.session_types.contains([normalized]),
                )
            )

    if filters.location:
        value = filters.location.strip()
        if value.lower() == "online":
            query = query.where(
                or_(
                    DoctorProfile.session_types.contains(["VIDEO"]),
                    DoctorProfile.session_types.contains(["AUDIO"]),
                    DoctorProfile.session_types.contains(["CHAT"]),
                    DoctorProfile.session_types.contains(["ONLINE"]),
                    DoctorProfile.session_types.contains(["Online"]),
                )
            )
        else:
            query = query.where(
                or_(
                    DoctorProfile.location_city.ilike(f"%{value}%"),
                    DoctorProfile.location_country.ilike(f"%{value}%"),
                )
            )

    if filters.insurance_provider:
        query = query.where(DoctorProfile.insurance_providers.contains([filters.insurance_provider]))

    if filters.min_price is not None:
        query = query.where(DoctorProfile.pricing_per_session >= filters.min_price)

    if filters.max_price is not None:
        query = query.where(DoctorProfile.pricing_per_session <= filters.max_price)

    return query


def _type_label(code: str) -> str:
    care = "Directive" if code[0] == "D" else "Collaborative"
    approach = "Evidence-based" if code[1] == "E" else "Holistic"
    specialization = "Generalist" if code[2] == "G" else "Specialist"
    return f"{care} {approach} {specialization}"


@router.post("/doctors", response_model=MatchResponseOut)
def match_doctors(payload: MatchRequestIn, db: Session = Depends(get_db)):
    code, axes = derive_type_code(payload.answers)

    query = _apply_filters(_base_public_query(), payload.filters)
    doctors = list(db.scalars(query.order_by(DoctorProfile.rating.desc().nullslast(), DoctorProfile.created_at.desc())))

    ranked = rank_doctors(doctors, code)
    exact = [item for item in ranked if infer_doctor_type_code(item.doctor) == code]
    shortlist = (exact if len(exact) >= 3 else ranked)[:3]

    axis_out = {
        "care": AxisOut(
            letter=code[0],
            primary_score=round(axes["care"].primary, 2),
            opposite_score=round(axes["care"].opposite, 2),
        ),
        "approach": AxisOut(
            letter=code[1],
            primary_score=round(axes["approach"].primary, 2),
            opposite_score=round(axes["approach"].opposite, 2),
        ),
        "specialization": AxisOut(
            letter=code[2],
            primary_score=round(axes["specialization"].primary, 2),
            opposite_score=round(axes["specialization"].opposite, 2),
        ),
    }

    return MatchResponseOut(
        user_type_code=code,
        label=_type_label(code),
        axes=axis_out,
        doctors=[
            MatchDoctorOut(
                similarity=round(item.similarity, 4),
                doctor_type_code=infer_doctor_type_code(item.doctor),
                doctor=item.doctor,
            )
            for item in shortlist
        ],
    )


class MatchAssessmentOut(BaseModel):
    user_type_code: str
    label: str
    estimated_completion_minutes: int
    computed_at: datetime


@router.post("/assessment", response_model=MatchAssessmentOut)
def assess_type(payload: MatchRequestIn):
    code, _ = derive_type_code(payload.answers)
    return MatchAssessmentOut(
        user_type_code=code,
        label=_type_label(code),
        estimated_completion_minutes=7,
        computed_at=datetime.now(UTC),
    )
