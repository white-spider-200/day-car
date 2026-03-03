from tests.conftest import auth_headers, register, submit_psychiatrist_application



def _approve_doctor(client, admin_token, email: str, profile_overrides: dict | None = None):
    register(client, email, "DoctorPass123!", "DOCTOR")
    doctor_token = client.post("/auth/login", json={"email": email, "password": "DoctorPass123!"}).json()["access_token"]

    payload = {
        "display_name": f"{email}-name",
        "headline": "Therapist",
        "specialties": ["Anxiety"],
        "concerns": ["Anxiety"],
        "therapy_approaches": ["CBT"],
        "languages": ["English"],
        "session_types": ["VIDEO"],
        "gender_identity": "Female",
        "insurance_providers": ["MedNet"],
        "location_city": "Amman",
        "pricing_per_session": "90.00",
    }
    if profile_overrides:
        payload.update(profile_overrides)

    app = submit_psychiatrist_application(client, doctor_token, save_overrides=payload)
    app_id = app["id"]

    client.post(f"/admin/applications/{app_id}/approve", headers=auth_headers(admin_token))
    return app["doctor_user_id"]



def _answers(value: int):
    return {
        **{f"care_{i}": value for i in range(1, 9)},
        **{f"approach_{i}": value for i in range(1, 9)},
        **{f"specialization_{i}": value for i in range(1, 9)},
    }



def test_matching_assessment_returns_type_code(client):
    response = client.post("/matching/assessment", json={"answers": _answers(5), "filters": {}})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["user_type_code"] in {"DEG", "DES", "DHG", "DHS", "CEG", "CES", "CHG", "CHS"}



def test_matching_doctors_returns_ranked_top_3(client, admin_token):
    _approve_doctor(
        client,
        admin_token,
        "doctor-match1@testmail.dev",
        profile_overrides={
            "therapy_approaches": ["CBT", "Structured"],
            "specialties": ["General Therapy"],
        },
    )
    _approve_doctor(
        client,
        admin_token,
        "doctor-match2@testmail.dev",
        profile_overrides={
            "therapy_approaches": ["Mindfulness", "Integrative"],
            "specialties": ["Trauma"],
        },
    )

    response = client.post(
        "/matching/doctors",
        json={
            "answers": _answers(5),
            "filters": {"language": "English", "session_type": "VIDEO"},
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["user_type_code"] in {"DEG", "DES", "DHG", "DHS", "CEG", "CES", "CHG", "CHS"}
    assert len(payload["doctors"]) >= 1
    assert all("similarity" in item for item in payload["doctors"])
