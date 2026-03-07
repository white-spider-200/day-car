import json
from io import BytesIO

from tests.conftest import auth_headers, login


def _application_payload(email: str):
    return {
        "professional_type": "PSYCHIATRIST",
        "full_name": "Dr Public Applicant",
        "email": email,
        "password": "DoctorPass123!",
        "phone": "+962790001122",
        "license_number": "LIC-100-AB",
        "license_issuing_authority": "Jordan Medical Council",
        "license_expiry_date": "2028-12-31",
        "legal_prescription_declaration": "I am authorized to prescribe psychiatric medications.",
        "psychiatrist_prescription_ack": "true",
        "experience_years": "9",
        "specialty": "Psychiatrist",
        "sub_specialties": "Trauma",
        "languages": "Arabic",
        "location": "Amman",
        "online_available": "true",
        "fee": "90",
        "short_bio": "Senior psychiatrist focused on trauma and anxiety support.",
        "about": "Detailed profile for admin review.",
        "schedule": json.dumps([{"day": "MONDAY", "start": "09:00", "end": "13:00"}]),
    }


def test_public_application_submit_duplicate_and_admin_approve(client, admin_token):
    first = client.post(
        "/doctor-applications",
        data=_application_payload("public.doctor@testmail.dev"),
        files={
            "photo": ("photo.png", BytesIO(b"\\x89PNG\\r\\n\\x1a\\n"), "image/png"),
            "national_id_photo": ("national-id.png", BytesIO(b"\\x89PNG\\r\\n\\x1a\\n"), "image/png"),
            "license_document": ("license.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf"),
            "medical_degree_certificate": ("medical-degree.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf"),
            "psychiatry_specialization_certificate": (
                "psychiatry-specialization.pdf",
                BytesIO(b"%PDF-1.4 test"),
                "application/pdf",
            ),
            "active_practice_proof": ("active-practice.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf"),
        },
    )
    assert first.status_code == 201, first.text
    assert first.json()["status"] == "SUBMITTED"
    doctor_token = login(client, "public.doctor@testmail.dev", "DoctorPass123!")
    doctor_application = client.get("/doctor/application", headers=auth_headers(doctor_token))
    assert doctor_application.status_code == 200, doctor_application.text
    assert doctor_application.json()["status"] == "SUBMITTED"

    duplicate = client.post(
        "/doctor-applications",
        data=_application_payload("public.doctor@testmail.dev"),
        files={"license_document": ("license.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")},
    )
    assert duplicate.status_code == 409, duplicate.text

    submitted = client.get("/admin/applications?status=SUBMITTED", headers=auth_headers(admin_token))
    assert submitted.status_code == 200, submitted.text
    app_item = next((row for row in submitted.json() if row["email"] == "public.doctor@testmail.dev"), None)
    assert app_item is not None

    approve = client.post(
        f"/admin/applications/{app_item['id']}/approve",
        headers=auth_headers(admin_token),
        json={"note": "Looks valid"},
    )
    assert approve.status_code == 200, approve.text
    assert approve.json()["status"] == "APPROVED_MD"
    assert approve.json()["doctor_user_id"] is not None

    doctor_profile = client.get(f"/doctors/{approve.json()['doctor_user_id']}")
    assert doctor_profile.status_code == 200, doctor_profile.text
    assert doctor_profile.json()["is_public"] is True
