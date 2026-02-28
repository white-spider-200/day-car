import json
from io import BytesIO

from tests.conftest import auth_headers


def _application_payload(email: str):
    return {
        "full_name": "Dr Public Applicant",
        "email": email,
        "phone": "+962790001122",
        "license_number": "LIC-100-AB",
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
            "license_document": ("license.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf"),
        },
    )
    assert first.status_code == 201, first.text
    assert first.json()["status"] == "PENDING"

    duplicate = client.post(
        "/doctor-applications",
        data=_application_payload("public.doctor@testmail.dev"),
        files={"license_document": ("license.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")},
    )
    assert duplicate.status_code == 409, duplicate.text

    pending = client.get("/admin/applications?status=PENDING", headers=auth_headers(admin_token))
    assert pending.status_code == 200, pending.text
    app_item = next((row for row in pending.json() if row["email"] == "public.doctor@testmail.dev"), None)
    assert app_item is not None

    approve = client.post(
        f"/admin/applications/{app_item['id']}/approve",
        headers=auth_headers(admin_token),
        json={"note": "Looks valid"},
    )
    assert approve.status_code == 200, approve.text
    assert approve.json()["status"] == "APPROVED"
    assert approve.json()["doctor_user_id"] is not None

    doctor_profile = client.get(f"/doctors/{approve.json()['doctor_user_id']}")
    assert doctor_profile.status_code == 200, doctor_profile.text
    assert doctor_profile.json()["is_public"] is True
