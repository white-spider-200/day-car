from datetime import UTC, datetime
import re
import secrets

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import (
    AdminAction,
    ApplicationStatus,
    DoctorApplication,
    DoctorProfile,
    User,
    UserRole,
    UserStatus,
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


def _slugify(value: str) -> str:
    lowered = value.strip().lower()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    return lowered.strip("-")


def _build_unique_slug(db: Session, preferred_value: str, doctor_user_id) -> str:
    base = _slugify(preferred_value) or f"doctor-{str(doctor_user_id)[:8]}"
    slug = base
    suffix = 2
    while True:
        existing = db.scalar(
            select(DoctorProfile).where(
                DoctorProfile.slug == slug, DoctorProfile.doctor_user_id != doctor_user_id
            )
        )
        if not existing:
            return slug
        slug = f"{base}-{suffix}"
        suffix += 1


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


def _resolve_or_create_doctor_user(db: Session, application: DoctorApplication) -> User:
    if application.doctor_user_id:
        existing = db.scalar(select(User).where(User.id == application.doctor_user_id))
        if not existing:
            raise ValueError("Application references a missing doctor user")
        return existing

    if not application.email:
        raise ValueError("Application email is required for approval")

    doctor_user = db.scalar(select(User).where(func.lower(User.email) == application.email.lower()))
    if doctor_user:
        if doctor_user.role != UserRole.DOCTOR:
            doctor_user.role = UserRole.DOCTOR
        if application.phone and not doctor_user.phone:
            doctor_user.phone = application.phone
        if doctor_user.status != UserStatus.ACTIVE:
            doctor_user.status = UserStatus.ACTIVE
    else:
        doctor_user = User(
            email=application.email.lower(),
            phone=application.phone,
            password_hash=hash_password(secrets.token_urlsafe(20)),
            role=UserRole.DOCTOR,
            status=UserStatus.ACTIVE,
        )
        db.add(doctor_user)
        db.flush()

    application.doctor_user_id = doctor_user.id
    return doctor_user


def approve_application(
    db: Session, application: DoctorApplication, admin: User, note: str | None = None
) -> DoctorApplication:
    now = datetime.now(UTC)
    doctor_user = _resolve_or_create_doctor_user(db, application)
    application.status = ApplicationStatus.APPROVED
    application.reviewed_at = now
    application.reviewer_admin_id = admin.id
    application.rejection_reason = None
    if note is not None:
        application.admin_note = note
        application.internal_notes = note

    profile = db.scalar(
        select(DoctorProfile).where(DoctorProfile.doctor_user_id == doctor_user.id)
    )
    if not profile:
        profile = DoctorProfile(
            doctor_user_id=doctor_user.id,
            display_name="Doctor",
            slug=f"doctor-{str(doctor_user.id)[:8]}",
        )
        db.add(profile)

    profile.display_name = (
        application.full_name or application.display_name or profile.display_name or "Doctor"
    )
    if not profile.slug or profile.slug.startswith("doctor-"):
        profile.slug = _build_unique_slug(db, profile.display_name, doctor_user.id)
    profile.headline = application.short_bio or application.headline
    profile.bio = application.about or application.bio
    profile.photo_url = application.photo_url
    profile.languages = application.languages
    profile.specialties = application.specialties or (
        [application.specialty] if application.specialty else None
    )
    profile.concerns = application.concerns
    profile.therapy_approaches = application.therapy_approaches
    profile.session_types = application.session_types or (
        ["ONLINE"] if application.online_available else ["IN_PERSON"]
    )
    profile.gender_identity = application.gender_identity
    profile.insurance_providers = application.insurance_providers
    profile.location_country = application.location_country
    profile.location_city = application.location_city
    profile.years_experience = application.years_experience
    profile.education = application.education
    profile.licenses_public = _sanitize_licenses_public(application.licenses)
    profile.pricing_currency = application.pricing_currency
    profile.pricing_per_session = application.consultation_fee or application.pricing_per_session
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
        metadata={"doctor_user_id": str(doctor_user.id)},
    )

    db.commit()
    db.refresh(application)
    return application


def reject_application(
    db: Session, application: DoctorApplication, admin: User, reason: str, note: str | None = None
) -> DoctorApplication:
    application.status = ApplicationStatus.REJECTED
    application.reviewer_admin_id = admin.id
    application.reviewed_at = datetime.now(UTC)
    application.rejection_reason = reason
    if note is not None:
        application.admin_note = note
        application.internal_notes = note

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
    application.admin_note = notes
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
