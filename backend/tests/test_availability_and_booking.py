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
            "display_name": "Bookable Doctor",
            "headline": "Availability test",
            "specialties": ["Stress"],
            "languages": ["English"],
            "session_types": ["VIDEO"],
            "pricing_per_session": "60.00",
        },
    )
    assert save.status_code == 200, save.text
    client.post("/doctor/application/submit", headers=auth_headers(doctor_token))
    app = client.get("/doctor/application", headers=auth_headers(doctor_token)).json()
    client.post(f"/admin/applications/{app['id']}/approve", headers=auth_headers(admin_token))
    return doctor_token, app["doctor_user_id"]


def test_availability_booking_conflict_and_cancellation(client, admin_token):
    doctor_token, doctor_user_id = _setup_approved_doctor(
        client, admin_token, "doctor-booking@test.local"
    )

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

    register(client, "book-user1@test.local", "UserPass123!", "USER")
    token_user_1 = client.post(
        "/auth/login", json={"email": "book-user1@test.local", "password": "UserPass123!"}
    ).json()["access_token"]

    register(client, "book-user2@test.local", "UserPass123!", "USER")
    token_user_2 = client.post(
        "/auth/login", json={"email": "book-user2@test.local", "password": "UserPass123!"}
    ).json()["access_token"]

    req_1 = client.post(
        "/appointments/request",
        headers=auth_headers(token_user_1),
        json={"doctor_user_id": doctor_user_id, "start_at": slot_start, "timezone": "Asia/Amman"},
    )
    assert req_1.status_code == 200, req_1.text

    req_2 = client.post(
        "/appointments/request",
        headers=auth_headers(token_user_2),
        json={"doctor_user_id": doctor_user_id, "start_at": slot_start, "timezone": "Asia/Amman"},
    )
    assert req_2.status_code == 200, req_2.text

    appointment_1 = req_1.json()["id"]
    appointment_2 = req_2.json()["id"]

    confirm_1 = client.post(
        f"/doctor/appointments/{appointment_1}/confirm", headers=auth_headers(doctor_token)
    )
    assert confirm_1.status_code == 200, confirm_1.text
    assert confirm_1.json()["status"] == "CONFIRMED"

    confirm_2 = client.post(
        f"/doctor/appointments/{appointment_2}/confirm", headers=auth_headers(doctor_token)
    )
    assert confirm_2.status_code == 409, confirm_2.text

    cancel_by_user = client.post(
        f"/appointments/{appointment_1}/cancel", headers=auth_headers(token_user_1)
    )
    assert cancel_by_user.status_code == 200, cancel_by_user.text
    assert cancel_by_user.json()["status"] == "CANCELLED"
