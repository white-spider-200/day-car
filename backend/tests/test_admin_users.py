from datetime import date, timedelta

from tests.conftest import auth_headers, register


def _next_weekday(start: date, weekday: int) -> date:
    delta = (weekday - start.weekday()) % 7
    return start + timedelta(days=delta)


def _setup_approved_doctor(client, admin_token, email: str):
    register(client, email, "DoctorPass123!", "DOCTOR")
    doctor_token = client.post("/auth/login", json={"email": email, "password": "DoctorPass123!"}).json()[
        "access_token"
    ]

    save = client.post(
        "/doctor/application/save",
        headers=auth_headers(doctor_token),
        json={
            "display_name": "Admin Users Doctor",
            "headline": "General Therapy",
            "specialties": ["Anxiety"],
            "languages": ["English"],
            "session_types": ["VIDEO"],
            "pricing_per_session": "70.00",
        },
    )
    assert save.status_code == 200, save.text

    submit = client.post("/doctor/application/submit", headers=auth_headers(doctor_token))
    assert submit.status_code == 200, submit.text

    app = client.get("/doctor/application", headers=auth_headers(doctor_token)).json()
    approve = client.post(f"/admin/applications/{app['id']}/approve", headers=auth_headers(admin_token))
    assert approve.status_code == 200, approve.text

    return doctor_token, app["doctor_user_id"]


def test_admin_users_list_and_detail(client, admin_token):
    doctor_token, doctor_user_id = _setup_approved_doctor(client, admin_token, "doctor-admin-users@testmail.dev")

    user_one = register(client, "user-one@testmail.dev", "UserPass123!", "USER")
    assert user_one.status_code == 201, user_one.text
    user_one_id = user_one.json()["id"]

    user_two = register(client, "user-two@testmail.dev", "UserPass123!", "USER")
    assert user_two.status_code == 201, user_two.text

    user_one_token = client.post(
        "/auth/login", json={"email": "user-one@testmail.dev", "password": "UserPass123!"}
    ).json()["access_token"]

    target_day = _next_weekday(date.today(), 0)
    set_rules = client.post(
        "/doctor/availability/rules",
        headers=auth_headers(doctor_token),
        json=[
            {
                "day_of_week": target_day.weekday(),
                "start_time": "09:00:00",
                "end_time": "12:00:00",
                "timezone": "Asia/Amman",
                "slot_duration_minutes": 50,
                "buffer_minutes": 10,
            }
        ],
    )
    assert set_rules.status_code == 200, set_rules.text

    slots_res = client.get(
        f"/doctors/{doctor_user_id}/availability",
        params={"date_from": target_day.isoformat(), "date_to": target_day.isoformat()},
    )
    assert slots_res.status_code == 200, slots_res.text
    slots = slots_res.json()
    assert len(slots) >= 1
    slot_start = slots[0]["start_at"]

    appointment_request = client.post(
        "/appointments/request",
        headers=auth_headers(user_one_token),
        json={
            "doctor_user_id": doctor_user_id,
            "start_at": slot_start,
            "timezone": "Asia/Amman",
        },
    )
    assert appointment_request.status_code == 200, appointment_request.text

    users_res = client.get("/admin/users", headers=auth_headers(admin_token))
    assert users_res.status_code == 200, users_res.text

    users_payload = users_res.json()
    assert any(item["email"] == "user-one@testmail.dev" for item in users_payload)
    assert any(item["email"] == "user-two@testmail.dev" for item in users_payload)

    user_one_list_item = next(item for item in users_payload if item["email"] == "user-one@testmail.dev")
    assert user_one_list_item["appointments_count"] >= 1
    assert user_one_list_item["upcoming_count"] >= 1

    search_res = client.get("/admin/users", headers=auth_headers(admin_token), params={"search": "user-one"})
    assert search_res.status_code == 200, search_res.text
    search_payload = search_res.json()
    assert len(search_payload) >= 1
    assert all("user-one" in (item["email"] or "") for item in search_payload)

    detail_res = client.get(f"/admin/users/{user_one_id}", headers=auth_headers(admin_token))
    assert detail_res.status_code == 200, detail_res.text

    detail = detail_res.json()
    assert detail["user"]["id"] == user_one_id
    assert detail["appointments_count"] >= 1
    assert len(detail["appointments"]) >= 1
    assert detail["appointments"][0]["doctor_display_name"] == "Admin Users Doctor"


def test_admin_users_security(client, admin_token):
    register(client, "regular-user@testmail.dev", "UserPass123!", "USER")
    user_token = client.post(
        "/auth/login", json={"email": "regular-user@testmail.dev", "password": "UserPass123!"}
    ).json()["access_token"]

    register(client, "regular-doctor@testmail.dev", "DoctorPass123!", "DOCTOR")
    doctor_token = client.post(
        "/auth/login", json={"email": "regular-doctor@testmail.dev", "password": "DoctorPass123!"}
    ).json()["access_token"]

    user_forbidden = client.get("/admin/users", headers=auth_headers(user_token))
    assert user_forbidden.status_code == 403

    doctor_forbidden = client.get("/admin/users", headers=auth_headers(doctor_token))
    assert doctor_forbidden.status_code == 403

    admin_users = client.get("/admin/users", headers=auth_headers(admin_token)).json()
    target_user_id = next(item["id"] for item in admin_users if item["email"] == "regular-user@testmail.dev")

    user_detail_forbidden = client.get(f"/admin/users/{target_user_id}", headers=auth_headers(user_token))
    assert user_detail_forbidden.status_code == 403

    doctor_detail_forbidden = client.get(f"/admin/users/{target_user_id}", headers=auth_headers(doctor_token))
    assert doctor_detail_forbidden.status_code == 403
