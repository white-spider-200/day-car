from tests.conftest import auth_headers, register


def _approve_doctor(client, admin_token, email: str, specialty: str, price: str):
    register(client, email, "DoctorPass123!", "DOCTOR")
    doctor_token = client.post("/auth/login", json={"email": email, "password": "DoctorPass123!"}).json()[
        "access_token"
    ]

    client.post(
        "/doctor/application/save",
        headers=auth_headers(doctor_token),
        json={
            "display_name": f"{email}-name",
            "headline": "Therapist",
            "specialties": [specialty],
            "languages": ["English"],
            "session_types": ["VIDEO"],
            "location_city": "Amman",
            "pricing_per_session": price,
        },
    )
    client.post("/doctor/application/submit", headers=auth_headers(doctor_token))
    app = client.get("/doctor/application", headers=auth_headers(doctor_token)).json()
    app_id = app["id"]

    client.post(f"/admin/applications/{app_id}/approve", headers=auth_headers(admin_token))
    return app["doctor_user_id"]


def test_directory_visibility_and_filters(client, admin_token):
    register(client, "doctor-before@test.local", "DoctorPass123!", "DOCTOR")
    doctor_token = client.post(
        "/auth/login", json={"email": "doctor-before@test.local", "password": "DoctorPass123!"}
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

    visible_one = _approve_doctor(client, admin_token, "doctor-visible1@test.local", "CBT", "90.00")
    _approve_doctor(client, admin_token, "doctor-visible2@test.local", "Anxiety", "40.00")

    after = client.get("/doctors")
    assert after.status_code == 200
    assert any(item["doctor_user_id"] == visible_one for item in after.json())

    filter_specialty = client.get("/doctors", params={"specialty": "CBT"})
    assert filter_specialty.status_code == 200
    assert all("CBT" in (item.get("specialties") or []) for item in filter_specialty.json())

    filter_price = client.get("/doctors", params={"min_price": 80, "max_price": 95})
    assert filter_price.status_code == 200
    assert all(80 <= float(item["pricing_per_session"]) <= 95 for item in filter_price.json())
