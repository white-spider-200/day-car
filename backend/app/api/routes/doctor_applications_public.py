import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import ApplicationStatus, DoctorApplication
from app.db.session import get_db
from app.schemas.public_doctor_application import (
    PublicDoctorApplicationCreate,
    PublicDoctorApplicationCreateOut,
)
from app.services.storage_service import save_application_photo, save_license_document

router = APIRouter(tags=["public"])


def _parse_schedule(schedule_raw: str) -> list[dict]:
    try:
        parsed = json.loads(schedule_raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid schedule format") from exc
    if not isinstance(parsed, list):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Schedule must be a list")
    return parsed


@router.post(
    "/doctor-applications",
    response_model=PublicDoctorApplicationCreateOut,
    status_code=status.HTTP_201_CREATED,
)
async def submit_public_doctor_application(
    request: Request,
    db: Session = Depends(get_db),
):
    form = await request.form()

    def required_text(key: str) -> str:
        value = form.get(key)
        if not isinstance(value, str) or not value.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} is required")
        return value.strip()

    def optional_text(key: str) -> str | None:
        value = form.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        return None

    def required_float(key: str) -> float:
        value = required_text(key)
        try:
            return float(value)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} must be numeric") from exc

    def required_int(key: str) -> int:
        value = required_text(key)
        try:
            return int(value)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} must be an integer") from exc

    def required_bool(key: str) -> bool:
        value = required_text(key).lower()
        if value in {"true", "1", "yes"}:
            return True
        if value in {"false", "0", "no"}:
            return False
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{key} must be true or false")

    full_name = required_text("full_name")
    email = required_text("email")
    phone = required_text("phone")
    national_id = optional_text("national_id")
    license_number = required_text("license_number")
    experience_years = required_int("experience_years")
    specialty = required_text("specialty")
    languages = [item.strip() for item in form.getlist("languages") if isinstance(item, str) and item.strip()]
    location = required_text("location")
    location_country = optional_text("location_country")
    clinic_name = optional_text("clinic_name")
    address_line = optional_text("address_line")
    map_url = optional_text("map_url")
    online_available = required_bool("online_available")
    fee = required_float("fee")
    short_bio = required_text("short_bio")
    about = optional_text("about")
    schedule = required_text("schedule")
    sub_specialties_values = [
        item.strip() for item in form.getlist("sub_specialties") if isinstance(item, str) and item.strip()
    ]
    sub_specialties = sub_specialties_values or None
    photo = form.get("photo")
    national_id_photo = form.get("national_id_photo")
    license_document = form.get("license_document")
    if not isinstance(license_document, UploadFile) and not (
        hasattr(license_document, "filename") and hasattr(license_document, "read")
    ):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="license_document is required")
    if photo is not None and not isinstance(photo, UploadFile) and not (
        hasattr(photo, "filename") and hasattr(photo, "read")
    ):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="photo must be a file")
    if national_id_photo is not None and not isinstance(national_id_photo, UploadFile) and not (
        hasattr(national_id_photo, "filename") and hasattr(national_id_photo, "read")
    ):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="national_id_photo must be a file")

    normalized_email = email.strip().lower()
    existing_application = db.scalar(
        select(DoctorApplication).where(func.lower(DoctorApplication.email) == normalized_email)
    )
    if existing_application:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An application with this email already exists")

    payload_data = {
        "full_name": full_name,
        "email": normalized_email,
        "phone": phone,
        "national_id": national_id,
        "license_number": license_number,
        "experience_years": experience_years,
        "specialty": specialty,
        "sub_specialties": sub_specialties,
        "languages": languages,
        "location": location,
        "location_country": location_country,
        "clinic_name": clinic_name,
        "address_line": address_line,
        "map_url": map_url,
        "online_available": online_available,
        "fee": fee,
        "short_bio": short_bio,
        "about": about,
        "schedule": _parse_schedule(schedule),
    }
    try:
        payload = PublicDoctorApplicationCreate.model_validate(payload_data)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors()) from exc

    photo_url = await save_application_photo(photo) if photo is not None else None
    national_id_photo_url = await save_application_photo(national_id_photo) if national_id_photo is not None else None
    license_document_url = await save_license_document(license_document)
    now = datetime.now(UTC)
    specialty_values = [payload.specialty]
    if payload.sub_specialties:
        specialty_values.extend(payload.sub_specialties)

    application = DoctorApplication(
        status=ApplicationStatus.PENDING,
        doctor_user_id=None,
        display_name=payload.full_name,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        photo_url=photo_url,
        license_number=payload.license_number,
        headline=payload.short_bio[:255],
        specialty=payload.specialty,
        sub_specialties=payload.sub_specialties,
        bio=payload.about,
        short_bio=payload.short_bio,
        about=payload.about,
        languages=payload.languages,
        specialties=specialty_values,
        location_city=payload.location,
        location_country=payload.location_country,
        clinic_name=payload.clinic_name,
        address_line=payload.address_line,
        map_url=payload.map_url,
        online_available=payload.online_available,
        session_types=["ONLINE"] if payload.online_available else ["IN_PERSON"],
        years_experience=payload.experience_years,
        consultation_fee=payload.fee,
        schedule=[slot.model_dump() for slot in payload.schedule],
        license_document_url=license_document_url,
        pricing_currency="JOD",
        pricing_per_session=payload.fee,
        submitted_at=now,
        national_id=national_id_photo_url or payload.national_id,
        rejection_reason=None,
        admin_note=None,
        internal_notes=None,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return PublicDoctorApplicationCreateOut(
        id=str(application.id),
        status=application.status.value,
        message="Your application is under review",
    )
