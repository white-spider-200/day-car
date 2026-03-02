from tests.conftest import auth_headers, register


def _approve_doctor(client, admin_token, email: str, specialty: str, price: str, save_overrides: dict | None = None):
    register(client, email, "DoctorPass123!", "DOCTOR")
    doctor_token = client.post("/auth/login", json={"email": email, "password": "DoctorPass123!"}).json()[
        "access_token"
    ]

    payload = {
        "display_name": f"{email}-name",
        "headline": "Therapist",
        "specialties": [specialty],
        "concerns": ["Anxiety"],
        "therapy_approaches": ["CBT"],
        "languages": ["English"],
        "session_types": ["VIDEO"],
        "gender_identity": "Female",
        "insurance_providers": ["MedNet"],
        "location_city": "Amman",
        "pricing_per_session": price,
    }
    if save_overrides:
        payload.update(save_overrides)

    client.post(
        "/doctor/application/save",
        headers=auth_headers(doctor_token),
        json=payload,
    )
    client.post("/doctor/application/submit", headers=auth_headers(doctor_token))
    app = client.get("/doctor/application", headers=auth_headers(doctor_token)).json()
    app_id = app["id"]

    client.post(f"/admin/applications/{app_id}/approve", headers=auth_headers(admin_token))
    return app["doctor_user_id"]


def test_directory_visibility_and_filters(client, admin_token):
    register(client, "doctor-before@testmail.dev", "DoctorPass123!", "DOCTOR")
    doctor_token = client.post(
        "/auth/login", json={"email": "doctor-before@testmail.dev", "password": "DoctorPass123!"}
    ).json()["access_token"]

    client.post(
        "/doctor/application/save",
        headers=auth_headers(doctor_token),
        json={
            "display_name": "Hidden Doctor",
            "specialties": ["Trauma"],
            "languages": ["English"],
            "pricing_per_session": "70.00",
        },
    )
    hidden_id = client.get("/doctor/application", headers=auth_headers(doctor_token)).json()["doctor_user_id"]

    before = client.get("/doctors")
    assert before.status_code == 200, before.text
    assert all(item["doctor_user_id"] != hidden_id for item in before.json())

    visible_one = _approve_doctor(
        client,
        admin_token,
        "doctor-visible1@testmail.dev",
        "CBT",
        "90.00",
        save_overrides={
            "concerns": ["Anxiety"],
            "therapy_approaches": ["CBT"],
            "session_types": ["VIDEO"],
            "gender_identity": "Female",
            "insurance_providers": ["MedNet"],
        },
    )
    visible_two = _approve_doctor(
        client,
        admin_token,
        "doctor-visible2@testmail.dev",
        "Anxiety",
        "40.00",
        save_overrides={
            "concerns": ["Depression"],
            "therapy_approaches": ["DBT"],
            "session_types": ["IN_PERSON"],
            "gender_identity": "Male",
            "insurance_providers": ["NatHealth"],
        },
    )

    after = client.get("/doctors")
    assert after.status_code == 200
    assert any(item["doctor_user_id"] == visible_one for item in after.json())

    filter_specialty = client.get("/doctors", params={"specialty": "CBT"})
    assert filter_specialty.status_code == 200
    assert all("CBT" in (item.get("specialties") or []) for item in filter_specialty.json())

    filter_price = client.get("/doctors", params={"min_price": 80, "max_price": 95})
    assert filter_price.status_code == 200
    assert all(80 <= float(item["pricing_per_session"]) <= 95 for item in filter_price.json())

    filter_concern = client.get("/doctors", params={"concern": "Anxiety"})
    assert filter_concern.status_code == 200
    assert any(item["doctor_user_id"] == visible_one for item in filter_concern.json())
    assert all("Anxiety" in (item.get("concerns") or []) for item in filter_concern.json())

    filter_approach = client.get("/doctors", params={"approach": "DBT"})
    assert filter_approach.status_code == 200
    assert any(item["doctor_user_id"] == visible_two for item in filter_approach.json())
    assert all("DBT" in (item.get("therapy_approaches") or []) for item in filter_approach.json())

    filter_gender = client.get("/doctors", params={"gender": "female"})
    assert filter_gender.status_code == 200
    assert all((item.get("gender_identity") or "").lower() == "female" for item in filter_gender.json())

    filter_insurance = client.get("/doctors", params={"insurance": "MedNet"})
    assert filter_insurance.status_code == 200
    assert any(item["doctor_user_id"] == visible_one for item in filter_insurance.json())
    assert all("MedNet" in (item.get("insurance_providers") or []) for item in filter_insurance.json())

    filter_online = client.get("/doctors", params={"online_only": True})
    assert filter_online.status_code == 200
    assert any(item["doctor_user_id"] == visible_one for item in filter_online.json())
    assert all(
        any(session in {"VIDEO", "AUDIO", "CHAT", "ONLINE"} for session in (item.get("session_types") or []))
        for item in filter_online.json()
    )

    city_online = client.get("/doctors", params={"city": "online"})
    assert city_online.status_code == 200
    assert any(item["doctor_user_id"] == visible_one for item in city_online.json())

    invalid_price_range = client.get("/doctors", params={"min_price": 100, "max_price": 90})
    assert invalid_price_range.status_code == 400
