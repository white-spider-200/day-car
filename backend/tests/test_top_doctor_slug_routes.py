import uuid

from sqlalchemy import select

from app.db.models import DoctorProfile
from app.db.session import SessionLocal
from tests.conftest import auth_headers, register


def _create_and_approve_doctor(client, admin_token, email: str, display_name: str) -> str:
    register(client, email, "DoctorPass123!", "DOCTOR")
    doctor_token = client.post("/auth/login", json={"email": email, "password": "DoctorPass123!"}).json()[
        "access_token"
    ]

    save = client.post(
        "/doctor/application/save",
        headers=auth_headers(doctor_token),
        json={
            "display_name": display_name,
            "headline": "Clinical Psychologist (CBT/ACT)",
            "specialties": ["Anxiety", "Depression"],
            "concerns": ["Anxiety"],
            "therapy_approaches": ["CBT", "ACT"],
            "languages": ["Arabic", "English"],
            "session_types": ["Online", "In-person"],
            "gender_identity": "Female",
            "insurance_providers": ["MedNet"],
            "location_city": "Amman",
            "pricing_per_session": "35.00",
        },
    )
    assert save.status_code == 200, save.text
    submit = client.post("/doctor/application/submit", headers=auth_headers(doctor_token))
    assert submit.status_code == 200, submit.text
    app = client.get("/doctor/application", headers=auth_headers(doctor_token)).json()
    app_id = app["id"]

    approve = client.post(f"/admin/applications/{app_id}/approve", headers=auth_headers(admin_token))
    assert approve.status_code == 200, approve.text
    return app["doctor_user_id"]


def test_top_doctor_and_slug_routes(client, admin_token):
    doctor_user_id = _create_and_approve_doctor(
        client,
        admin_token,
        "doctor-lina@testmail.dev",
        "Dr Lina Sabri",
    )

    with SessionLocal() as db:
        profile = db.scalar(select(DoctorProfile).where(DoctorProfile.doctor_user_id == uuid.UUID(doctor_user_id)))
        assert profile is not None
        profile.is_top_doctor = True
        profile.rating = 4.9
        profile.reviews_count = 128
        db.commit()

    top = client.get("/doctors/top")
    assert top.status_code == 200, top.text
    top_payload = top.json()
    assert top_payload is not None
    assert top_payload["slug"] == "dr-lina-sabri"
    assert top_payload["display_name"] == "Dr Lina Sabri"

    by_slug = client.get("/doctors/slug/dr-lina-sabri")
    assert by_slug.status_code == 200, by_slug.text
    assert by_slug.json()["doctor_user_id"] == doctor_user_id

    not_found = client.get("/doctors/slug/unknown-doctor")
    assert not_found.status_code == 404
