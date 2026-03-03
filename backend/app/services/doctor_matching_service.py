from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Iterable, Literal

from app.db.models import DoctorProfile

DoctorAxis = Literal["D", "C", "E", "H", "G", "S"]
DoctorTypeCode = Literal["DEG", "DES", "DHG", "DHS", "CEG", "CES", "CHG", "CHS"]
LikertValue = Literal[1, 2, 3, 4, 5]


@dataclass(slots=True)
class AxisScore:
    primary: float
    opposite: float


@dataclass(slots=True)
class MatchResult:
    doctor: DoctorProfile
    similarity: float
    sort_score: float


# 24 items: 8 per axis, alternating polarity.
CARE_QUESTION_IDS = [f"care_{i}" for i in range(1, 9)]
APPROACH_QUESTION_IDS = [f"approach_{i}" for i in range(1, 9)]
SPECIALIZATION_QUESTION_IDS = [f"specialization_{i}" for i in range(1, 9)]

POSITIVE_IDS = {
    # Care style: directive-positive ids
    "care_1",
    "care_3",
    "care_5",
    "care_7",
    # Medical approach: evidence-positive ids
    "approach_1",
    "approach_3",
    "approach_5",
    "approach_7",
    # Specialization: specialist-positive ids
    "specialization_2",
    "specialization_4",
    "specialization_6",
    "specialization_8",
}


def _score_axis(answers: dict[str, int], question_ids: list[str]) -> AxisScore:
    primary = 0.0
    opposite = 0.0
    for qid in question_ids:
        value = int(answers[qid])
        if qid in POSITIVE_IDS:
            primary += value
            opposite += 6 - value
        else:
            primary += 6 - value
            opposite += value
    return AxisScore(primary=primary, opposite=opposite)


def derive_type_code(answers: dict[str, int]) -> tuple[DoctorTypeCode, dict[str, AxisScore]]:
    care = _score_axis(answers, CARE_QUESTION_IDS)
    approach = _score_axis(answers, APPROACH_QUESTION_IDS)
    specialization = _score_axis(answers, SPECIALIZATION_QUESTION_IDS)

    care_letter: DoctorAxis = "D" if care.primary > care.opposite else "C"
    approach_letter: DoctorAxis = "E" if approach.primary > approach.opposite else "H"
    specialization_letter: DoctorAxis = "S" if specialization.primary > specialization.opposite else "G"

    code = f"{care_letter}{approach_letter}{specialization_letter}"
    return code, {"care": care, "approach": approach, "specialization": specialization}


def normalize_type_code(code: str | None) -> str | None:
    if not code:
        return None
    normalized = code.strip().upper()
    if len(normalized) != 3:
        return None
    if normalized[0] not in {"D", "C"}:
        return None
    if normalized[1] not in {"E", "H"}:
        return None
    if normalized[2] not in {"G", "S"}:
        return None
    return normalized


def infer_doctor_type_code(profile: DoctorProfile) -> DoctorTypeCode:
    stored = normalize_type_code(profile.doctor_type_code)
    if stored:
        return stored  # type: ignore[return-value]

    approaches = [a.lower() for a in (profile.therapy_approaches or [])]
    concerns = [c.lower() for c in (profile.concerns or [])]
    specialties = [s.lower() for s in (profile.specialties or [])]

    directive_keywords = {"structured", "cbt", "protocol", "plan", "clinical"}
    collaborative_keywords = {"humanistic", "person-centered", "supportive", "integrative", "talk"}

    evidence_keywords = {"cbt", "dbt", "act", "clinical", "diagnostic", "protocol"}
    holistic_keywords = {"mindfulness", "integrative", "holistic", "lifestyle", "wellness", "preventive"}

    specialist_keywords = {
        "ocd",
        "ptsd",
        "adhd",
        "addiction",
        "trauma",
        "eating",
        "bipolar",
        "personality",
        "phobia",
    }

    generalist_keywords = {"general", "wellbeing", "stress", "anxiety", "depression", "life"}

    def _count(source: Iterable[str], keywords: set[str]) -> int:
        total = 0
        for item in source:
            if any(keyword in item for keyword in keywords):
                total += 1
        return total

    directive_score = _count(approaches + specialties, directive_keywords)
    collaborative_score = _count(approaches + specialties, collaborative_keywords)
    care_letter = "D" if directive_score > collaborative_score else "C"

    evidence_score = _count(approaches + concerns, evidence_keywords)
    holistic_score = _count(approaches + concerns, holistic_keywords)
    approach_letter = "E" if evidence_score > holistic_score else "H"

    specialist_score = _count(specialties + concerns, specialist_keywords)
    generalist_score = _count(specialties + concerns, generalist_keywords)
    specialization_letter = "S" if specialist_score > generalist_score else "G"

    return f"{care_letter}{approach_letter}{specialization_letter}"  # type: ignore[return-value]


def similarity_score(user_code: str, doctor_code: str) -> float:
    matches = sum(1 for u, d in zip(user_code, doctor_code) if u == d)
    return matches / 3


def availability_score(next_available_at: datetime | None) -> float:
    if not next_available_at:
        return 0.1
    now = datetime.now(UTC)
    delta = (next_available_at - now).total_seconds()
    if delta <= 0:
        return 1.0
    days = delta / 86_400
    return max(0.0, 1.0 - days / 14)


def rating_score(rating: float | None, reviews_count: int | None) -> float:
    if not rating:
        return 0.0
    normalized = max(0.0, min(1.0, rating / 5))
    confidence = min(1.0, (reviews_count or 0) / 80)
    return normalized * (0.6 + 0.4 * confidence)


def rank_doctors(doctors: list[DoctorProfile], user_type_code: str) -> list[MatchResult]:
    ranked: list[MatchResult] = []
    for doctor in doctors:
        doctor_code = infer_doctor_type_code(doctor)
        similarity = similarity_score(user_type_code, doctor_code)

        verified = 1.0 if "VERIFIED_DOCTOR" in (doctor.verification_badges or []) else 0.0
        score = (
            similarity * 0.62
            + rating_score(float(doctor.rating) if doctor.rating is not None else None, doctor.reviews_count) * 0.2
            + verified * 0.1
            + availability_score(doctor.next_available_at) * 0.08
        )
        ranked.append(MatchResult(doctor=doctor, similarity=similarity, sort_score=score))

    ranked.sort(key=lambda item: (item.sort_score, item.similarity, item.doctor.reviews_count or 0), reverse=True)
    return ranked
