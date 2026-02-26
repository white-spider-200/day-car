from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    AdminAction,
    ApplicationStatus,
    DoctorApplication,
    DoctorProfile,
    User,
)


def _sanitize_licenses_public(licenses: list[dict] | None) -> list[dict] | None:
    if not licenses:
        return None
    allowed_fields = {"authority", "state", "country", "issued_at", "expires_at", "type", "name"}
    sanitized: list[dict] = []
    for item in licenses:
        if not isinstance(item, dict):
            continue
        sanitized.append({key: value for key, value in item.items() if key in allowed_fields})
    return sanitized


def log_admin_action(
    db: Session, admin_user_id, action_type: str, target_id, metadata: dict | None = None
) -> None:
    action = AdminAction(
        admin_user_id=admin_user_id,
        action_type=action_type,
        target_id=target_id,
        metadata_json=metadata or {},
    )
    db.add(action)


def approve_application(db: Session, application: DoctorApplication, admin: User) -> DoctorApplication:
    now = datetime.now(UTC)
    application.status = ApplicationStatus.APPROVED
    application.reviewed_at = now
    application.reviewer_admin_id = admin.id
    application.rejection_reason = None

    profile = db.scalar(
        select(DoctorProfile).where(DoctorProfile.doctor_user_id == application.doctor_user_id)
    )
    if not profile:
        profile = DoctorProfile(doctor_user_id=application.doctor_user_id, display_name="Doctor")
        db.add(profile)

    profile.display_name = application.display_name or profile.display_name or "Doctor"
    profile.headline = application.headline
    profile.bio = application.bio
    profile.languages = application.languages
    profile.specialties = application.specialties
    profile.session_types = application.session_types
    profile.location_country = application.location_country
    profile.location_city = application.location_city
    profile.years_experience = application.years_experience
    profile.education = application.education
    profile.licenses_public = _sanitize_licenses_public(application.licenses)
    profile.pricing_currency = application.pricing_currency
    profile.pricing_per_session = application.pricing_per_session
    profile.pricing_notes = application.pricing_notes

    existing_badges = set(profile.verification_badges or [])
    existing_badges.add("VERIFIED_DOCTOR")
    profile.verification_badges = sorted(existing_badges)
    profile.is_public = True
    if profile.published_at is None:
        profile.published_at = now

    log_admin_action(
        db,
        admin_user_id=admin.id,
        action_type="APPLICATION_APPROVED",
        target_id=application.id,
        metadata={"doctor_user_id": str(application.doctor_user_id)},
    )

    db.commit()
    db.refresh(application)
    return application


def reject_application(
    db: Session, application: DoctorApplication, admin: User, reason: str
) -> DoctorApplication:
    application.status = ApplicationStatus.REJECTED
    application.reviewer_admin_id = admin.id
    application.reviewed_at = datetime.now(UTC)
    application.rejection_reason = reason

    log_admin_action(
        db,
        admin_user_id=admin.id,
        action_type="APPLICATION_REJECTED",
        target_id=application.id,
        metadata={"reason": reason},
    )

    db.commit()
    db.refresh(application)
    return application


def request_changes(
    db: Session, application: DoctorApplication, admin: User, notes: str
) -> DoctorApplication:
    application.status = ApplicationStatus.NEEDS_CHANGES
    application.reviewer_admin_id = admin.id
    application.reviewed_at = datetime.now(UTC)
    application.internal_notes = notes

    log_admin_action(
        db,
        admin_user_id=admin.id,
        action_type="APPLICATION_NEEDS_CHANGES",
        target_id=application.id,
        metadata={"notes": notes},
    )

    db.commit()
    db.refresh(application)
    return application
