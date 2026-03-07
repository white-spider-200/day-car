from __future__ import annotations

import base64
import hashlib
import io
import uuid
from datetime import UTC, datetime, timedelta

import qrcode
from fastapi import HTTPException, status
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.professional_roles import can_prescribe_medication
from app.db.models import (
    Appointment,
    AppointmentStatus,
    DoctorProfile,
    Prescription,
    PrescriptionStatus,
    TreatmentRequest,
    TreatmentRequestStatus,
    User,
    UserRole,
)
from app.schemas.prescription import PrescriptionCreateIn
from app.services.professional_type_service import get_doctor_professional_type
from app.services.storage_service import save_generated_document_bytes


def _has_doctor_patient_relationship(db: Session, *, doctor_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    has_appointment = db.scalar(
        select(Appointment.id).where(
            Appointment.doctor_user_id == doctor_id,
            Appointment.user_id == user_id,
            Appointment.status.in_(
                [
                    AppointmentStatus.REQUESTED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.NO_SHOW,
                ]
            ),
        )
    )
    if has_appointment:
        return True

    accepted_treatment_request = db.scalar(
        select(TreatmentRequest.id).where(
            TreatmentRequest.doctor_id == doctor_id,
            TreatmentRequest.user_id == user_id,
            TreatmentRequest.status == TreatmentRequestStatus.ACCEPTED,
        )
    )
    return accepted_treatment_request is not None


def _build_verification_url(prescription_id: uuid.UUID, code: str) -> str:
    base = settings.payment_public_base_url.rstrip("/")
    return f"{base}/prescriptions/verify/{prescription_id}?code={code}"


def _qr_png_bytes(value: str) -> bytes:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(value)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    output = io.BytesIO()
    img.save(output, format="PNG")
    return output.getvalue()


def _pdf_bytes(
    *,
    prescription_id: uuid.UUID,
    doctor_name: str,
    doctor_email: str | None,
    patient_name: str,
    patient_email: str | None,
    medication_name: str,
    dosage: str,
    instructions: str,
    quantity: str,
    issued_at: datetime,
    valid_until: datetime | None,
    verification_code: str,
    verification_url: str,
    data_hash: str,
) -> bytes:
    qr_png = _qr_png_bytes(verification_url)
    qr_img = ImageReader(io.BytesIO(qr_png))

    output = io.BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    width, height = A4

    y = height - 22 * mm
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(18 * mm, y, "Medication Prescription")

    y -= 10 * mm
    pdf.setFont("Helvetica", 10)
    pdf.drawString(18 * mm, y, f"Prescription ID: {prescription_id}")
    y -= 6 * mm
    pdf.drawString(18 * mm, y, f"Issued at (UTC): {issued_at.isoformat()}")
    if valid_until:
        y -= 6 * mm
        pdf.drawString(18 * mm, y, f"Valid until (UTC): {valid_until.isoformat()}")

    y -= 10 * mm
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(18 * mm, y, "Doctor")
    y -= 6 * mm
    pdf.setFont("Helvetica", 10)
    pdf.drawString(18 * mm, y, f"Name: {doctor_name}")
    y -= 6 * mm
    pdf.drawString(18 * mm, y, f"Email: {doctor_email or 'N/A'}")

    y -= 10 * mm
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(18 * mm, y, "Patient")
    y -= 6 * mm
    pdf.setFont("Helvetica", 10)
    pdf.drawString(18 * mm, y, f"Name: {patient_name}")
    y -= 6 * mm
    pdf.drawString(18 * mm, y, f"Email: {patient_email or 'N/A'}")

    y -= 10 * mm
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(18 * mm, y, "Medication")
    y -= 6 * mm
    pdf.setFont("Helvetica", 10)
    pdf.drawString(18 * mm, y, f"Medicine: {medication_name}")
    y -= 6 * mm
    pdf.drawString(18 * mm, y, f"Dosage: {dosage}")
    y -= 6 * mm
    pdf.drawString(18 * mm, y, f"Quantity: {quantity}")
    y -= 6 * mm
    pdf.drawString(18 * mm, y, "Instructions:")
    y -= 5 * mm
    text = pdf.beginText(20 * mm, y)
    text.setFont("Helvetica", 10)
    for line in instructions.splitlines() or ["N/A"]:
        text.textLine(line[:140])
        y -= 5 * mm
    pdf.drawText(text)

    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(18 * mm, 44 * mm, "Pharmacy Verification QR")
    pdf.setFont("Helvetica", 9)
    pdf.drawString(18 * mm, 39 * mm, "Scan to verify prescription authenticity")
    pdf.drawString(18 * mm, 34 * mm, f"Verification code: {verification_code}")
    pdf.drawString(18 * mm, 29 * mm, f"Data hash: {data_hash}")
    pdf.drawImage(qr_img, width - 65 * mm, 20 * mm, width=40 * mm, height=40 * mm, mask="auto")

    pdf.showPage()
    pdf.save()
    return output.getvalue()


def _canonical_hash(
    *,
    prescription_id: uuid.UUID,
    doctor_user_id: uuid.UUID,
    user_id: uuid.UUID,
    medication_name: str,
    dosage: str,
    instructions: str,
    quantity: str,
    issued_at: datetime,
    valid_until: datetime | None,
    verification_code: str,
) -> str:
    payload = "|".join(
        [
            str(prescription_id),
            str(doctor_user_id),
            str(user_id),
            medication_name.strip(),
            dosage.strip(),
            instructions.strip(),
            quantity.strip(),
            issued_at.isoformat(),
            valid_until.isoformat() if valid_until else "",
            verification_code,
        ]
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def create_prescription(db: Session, *, doctor_user: User, payload: PrescriptionCreateIn):
    if doctor_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can create prescriptions")

    professional_type = get_doctor_professional_type(db, doctor_user_id=doctor_user.id)
    if not can_prescribe_medication(professional_type):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only psychiatrists can issue medication prescriptions.",
        )

    patient = db.scalar(select(User).where(User.id == payload.user_id, User.role == UserRole.USER))
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    if not _has_doctor_patient_relationship(db, doctor_id=doctor_user.id, user_id=payload.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor is not assigned to this patient.",
        )

    doctor_profile = db.scalar(select(DoctorProfile).where(DoctorProfile.doctor_user_id == doctor_user.id))
    doctor_name = (doctor_profile.display_name if doctor_profile else None) or doctor_user.name or doctor_user.email or "Doctor"
    patient_name = patient.name or patient.email or f"User {str(patient.id)[:8]}"

    prescription_id = uuid.uuid4()
    verification_code = f"RX-{uuid.uuid4().hex[:10].upper()}"
    issued_at = datetime.now(UTC)
    valid_until = issued_at + timedelta(days=payload.valid_days) if payload.valid_days else None
    verification_url = _build_verification_url(prescription_id, verification_code)

    data_hash = _canonical_hash(
        prescription_id=prescription_id,
        doctor_user_id=doctor_user.id,
        user_id=patient.id,
        medication_name=payload.medication_name,
        dosage=payload.dosage,
        instructions=payload.instructions,
        quantity=payload.quantity,
        issued_at=issued_at,
        valid_until=valid_until,
        verification_code=verification_code,
    )

    pdf = _pdf_bytes(
        prescription_id=prescription_id,
        doctor_name=doctor_name,
        doctor_email=doctor_user.email,
        patient_name=patient_name,
        patient_email=patient.email,
        medication_name=payload.medication_name,
        dosage=payload.dosage,
        instructions=payload.instructions,
        quantity=payload.quantity,
        issued_at=issued_at,
        valid_until=valid_until,
        verification_code=verification_code,
        verification_url=verification_url,
        data_hash=data_hash,
    )
    pdf_url = save_generated_document_bytes(pdf, extension=".pdf")

    row = Prescription(
        id=prescription_id,
        doctor_user_id=doctor_user.id,
        user_id=patient.id,
        medication_name=payload.medication_name.strip(),
        dosage=payload.dosage.strip(),
        instructions=payload.instructions.strip(),
        quantity=payload.quantity.strip(),
        issued_at=issued_at,
        valid_until=valid_until,
        verification_code=verification_code,
        data_hash=data_hash,
        pdf_url=pdf_url,
        status=PrescriptionStatus.ACTIVE,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    qr_data_url = f"data:image/png;base64,{base64.b64encode(_qr_png_bytes(verification_url)).decode('ascii')}"
    return row, verification_url, qr_data_url


def list_doctor_prescriptions(db: Session, *, doctor_user: User, user_id: uuid.UUID | None = None) -> list[Prescription]:
    if doctor_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can list prescriptions")
    query = select(Prescription).where(Prescription.doctor_user_id == doctor_user.id)
    if user_id is not None:
        query = query.where(Prescription.user_id == user_id)
    return list(db.scalars(query.order_by(Prescription.created_at.desc())))


def verify_prescription(db: Session, *, prescription_id: uuid.UUID, code: str):
    row = db.scalar(select(Prescription).where(Prescription.id == prescription_id))
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    doctor = db.scalar(select(User).where(User.id == row.doctor_user_id))
    patient = db.scalar(select(User).where(User.id == row.user_id))
    is_code_match = row.verification_code == code

    recomputed_hash = _canonical_hash(
        prescription_id=row.id,
        doctor_user_id=row.doctor_user_id,
        user_id=row.user_id,
        medication_name=row.medication_name,
        dosage=row.dosage,
        instructions=row.instructions,
        quantity=row.quantity,
        issued_at=row.issued_at,
        valid_until=row.valid_until,
        verification_code=row.verification_code,
    )
    hash_ok = recomputed_hash == row.data_hash
    not_expired = row.valid_until is None or row.valid_until >= datetime.now(UTC)
    is_valid = is_code_match and hash_ok and row.status == PrescriptionStatus.ACTIVE and not_expired

    if row.status == PrescriptionStatus.ACTIVE and row.valid_until and row.valid_until < datetime.now(UTC):
        row.status = PrescriptionStatus.EXPIRED
        db.commit()
        db.refresh(row)

    return {
        "prescription_id": row.id,
        "is_valid": is_valid,
        "status": row.status,
        "issued_at": row.issued_at,
        "valid_until": row.valid_until,
        "doctor": {
            "id": str(row.doctor_user_id),
            "name": doctor.name if doctor else None,
            "email": doctor.email if doctor else None,
        },
        "patient": {
            "id": str(row.user_id),
            "name": patient.name if patient else None,
            "email": patient.email if patient else None,
        },
        "medication": {
            "name": row.medication_name,
            "dosage": row.dosage,
            "instructions": row.instructions,
            "quantity": row.quantity,
        },
        "data_hash": row.data_hash,
        "pdf_url": row.pdf_url,
    }
