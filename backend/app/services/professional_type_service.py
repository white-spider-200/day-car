from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.professional_roles import ProfessionalType
from app.db.models import DoctorApplication, DoctorDocument, DoctorProfile, DocumentStatus, DocumentType

_PSYCHIATRIST_REQUIRED_DOC_TYPES = {
    DocumentType.LICENSE,
    DocumentType.PSYCHIATRY_SPECIALIZATION,
}
_THERAPIST_REQUIRED_DOC_TYPES = {
    DocumentType.LICENSE,
    DocumentType.THERAPY_SPECIALIZATION,
    DocumentType.SPECIALIZATION_CERTIFICATE,
}


def _missing_doc_types(db: Session, *, application_id, required_types: set[DocumentType]) -> list[DocumentType]:
    uploaded_types = set(
        db.scalars(select(DoctorDocument.type).where(DoctorDocument.application_id == application_id))
    )
    return sorted(required_types - uploaded_types, key=lambda item: item.value)


def validate_application_by_professional_type(db: Session, application: DoctorApplication) -> None:
    if application.professional_type is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="professional_type is required",
        )

    if application.professional_type == ProfessionalType.PSYCHIATRIST:
        missing_fields: list[str] = []
        if not application.license_number:
            missing_fields.append("license_number")
        if not application.license_issuing_authority:
            missing_fields.append("license_issuing_authority")
        if not application.license_expiry_date:
            missing_fields.append("license_expiry_date")
        if not application.legal_prescription_declaration:
            missing_fields.append("legal_prescription_declaration")
        if application.psychiatrist_prescription_ack is not True:
            missing_fields.append("psychiatrist_prescription_ack")
        if not application.national_id:
            missing_fields.append("national_id")

        missing_docs = _missing_doc_types(
            db, application_id=application.id, required_types=_PSYCHIATRIST_REQUIRED_DOC_TYPES
        )
        if missing_docs:
            missing_fields.append(
                "documents:" + ",".join(item.value for item in missing_docs)
            )

        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "message": "Psychiatrist application is missing required fields/documents",
                    "missing": missing_fields,
                },
            )
        return

    missing_fields = []
    if not application.accreditation_body:
        missing_fields.append("accreditation_body")
    if application.years_experience is None:
        missing_fields.append("years_experience")
    if not application.no_prescription_declaration:
        missing_fields.append("no_prescription_declaration")
    if application.therapist_no_prescription_ack is not True:
        missing_fields.append("therapist_no_prescription_ack")
    if not application.national_id:
        missing_fields.append("national_id")
    missing_docs = _missing_doc_types(
        db, application_id=application.id, required_types=_THERAPIST_REQUIRED_DOC_TYPES
    )
    if missing_docs:
        missing_fields.append("documents:" + ",".join(item.value for item in missing_docs))
    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Therapist application is missing required fields/documents",
                "missing": missing_fields,
            },
        )


def get_doctor_professional_type(db: Session, *, doctor_user_id) -> ProfessionalType | None:
    profile = db.scalar(select(DoctorProfile.professional_type).where(DoctorProfile.doctor_user_id == doctor_user_id))
    if profile is not None:
        return profile
    application = db.scalar(
        select(DoctorApplication.professional_type).where(DoctorApplication.doctor_user_id == doctor_user_id)
    )
    return application


def get_application_verification_status(db: Session, *, application_id) -> str:
    statuses = list(
        db.scalars(select(DoctorDocument.status).where(DoctorDocument.application_id == application_id))
    )
    if not statuses:
        return "NO_DOCUMENTS"
    if all(status_item == DocumentStatus.ACCEPTED for status_item in statuses):
        return "VERIFIED"
    if any(status_item == DocumentStatus.REJECTED for status_item in statuses):
        return "REJECTED"
    return "PENDING"
