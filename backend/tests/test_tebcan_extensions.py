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
            "headline": "Extensions test",
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


def _setup_slot(client, doctor_token, doctor_user_id):
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
                "is_blocked": False,
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
    return slots[0]["start_at"]


def test_waiting_list_promotion_on_cancellation(client, admin_token):
    doctor_token, doctor_user_id = _setup_approved_doctor(
        client, admin_token, "doctor.waitinglist@testmail.dev"
    )
    slot_start = _setup_slot(client, doctor_token, doctor_user_id)

    register(client, "waiting.user1@testmail.dev", "UserPass123!", "USER")
    token_user_1 = client.post(
        "/auth/login", json={"email": "waiting.user1@testmail.dev", "password": "UserPass123!"}
    ).json()["access_token"]

    register(client, "waiting.user2@testmail.dev", "UserPass123!", "USER")
    token_user_2 = client.post(
        "/auth/login", json={"email": "waiting.user2@testmail.dev", "password": "UserPass123!"}
    ).json()["access_token"]

    req_1 = client.post(
        "/appointments/request",
        headers=auth_headers(token_user_1),
        json={"doctor_user_id": doctor_user_id, "start_at": slot_start, "timezone": "Asia/Amman"},
    )
    assert req_1.status_code == 200, req_1.text
    appointment_1 = req_1.json()["id"]

    confirm_1 = client.post(
        f"/doctor/appointments/{appointment_1}/confirm", headers=auth_headers(doctor_token)
    )
    assert confirm_1.status_code == 200, confirm_1.text

    req_2 = client.post(
        "/appointments/request",
        headers=auth_headers(token_user_2),
        json={"doctor_user_id": doctor_user_id, "start_at": slot_start, "timezone": "Asia/Amman"},
    )
    assert req_2.status_code == 409, req_2.text
    detail = req_2.json()["detail"]
    conflicting_appointment_id = detail["conflicting_appointment_id"]
    assert conflicting_appointment_id == appointment_1

    waiting_join = client.post(
        f"/appointments/{appointment_1}/waiting-list",
        headers=auth_headers(token_user_2),
    )
    assert waiting_join.status_code == 200, waiting_join.text
    assert waiting_join.json()["position"] == 1

    cancel = client.post(f"/appointments/{appointment_1}/cancel", headers=auth_headers(token_user_1))
    assert cancel.status_code == 200, cancel.text
    assert cancel.json()["status"] == "CANCELLED"

    doctor_appointments = client.get("/doctor/appointments", headers=auth_headers(doctor_token))
    assert doctor_appointments.status_code == 200, doctor_appointments.text
    promoted = [
        item
        for item in doctor_appointments.json()
        if item["user_id"] != req_1.json()["user_id"] and item["start_at"] == slot_start
    ]
    assert promoted, doctor_appointments.json()

    waiting_list_view = client.get(
        f"/appointments/{appointment_1}/waiting-list",
        headers=auth_headers(token_user_2),
    )
    assert waiting_list_view.status_code == 403, waiting_list_view.text


def test_treatment_request_workflow(client, admin_token):
    doctor_token, doctor_user_id = _setup_approved_doctor(
        client, admin_token, "doctor.treatment@testmail.dev"
    )
    register(client, "treatment.user@testmail.dev", "UserPass123!", "USER")
    user_token = client.post(
        "/auth/login", json={"email": "treatment.user@testmail.dev", "password": "UserPass123!"}
    ).json()["access_token"]

    create_request = client.post(
        "/treatment-requests",
        headers=auth_headers(user_token),
        json={"doctor_id": doctor_user_id, "message": "I need help with anxiety and sleep issues."},
    )
    assert create_request.status_code == 200, create_request.text
    request_id = create_request.json()["id"]

    incoming = client.get("/doctor/treatment-requests", headers=auth_headers(doctor_token))
    assert incoming.status_code == 200, incoming.text
    assert any(item["id"] == request_id for item in incoming.json())

    accept = client.patch(
        f"/treatment-requests/{request_id}",
        headers=auth_headers(doctor_token),
        json={"status": "ACCEPTED"},
    )
    assert accept.status_code == 200, accept.text
    assert accept.json()["status"] == "ACCEPTED"


def test_admin_financial_report_aggregate(client, admin_token):
    doctor_token, doctor_user_id = _setup_approved_doctor(
        client, admin_token, "doctor.finance@testmail.dev"
    )
    slot_start = _setup_slot(client, doctor_token, doctor_user_id)

    register(client, "finance.user@testmail.dev", "UserPass123!", "USER")
    user_token = client.post(
        "/auth/login", json={"email": "finance.user@testmail.dev", "password": "UserPass123!"}
    ).json()["access_token"]

    request_appointment = client.post(
        "/appointments/request",
        headers=auth_headers(user_token),
        json={"doctor_user_id": doctor_user_id, "start_at": slot_start, "timezone": "Asia/Amman"},
    )
    assert request_appointment.status_code == 200, request_appointment.text
    appointment_id = request_appointment.json()["id"]

    payment_init = client.post(
        "/payments",
        headers=auth_headers(user_token),
        json={
            "appointment_id": appointment_id,
            "amount": "45.00",
            "method": "CARD",
            "insurance_provider": "TestInsurance",
        },
    )
    assert payment_init.status_code == 200, payment_init.text
    payment_id = payment_init.json()["payment"]["id"]

    payment_confirm = client.post(
        f"/payments/{payment_id}/confirm",
        headers=auth_headers(user_token),
    )
    assert payment_confirm.status_code == 200, payment_confirm.text
    assert payment_confirm.json()["payment"]["status"] == "PAID"

    today = date.today().isoformat()
    report = client.get(
        f"/admin/financial-reports?from_date={today}&to_date={today}&granularity=daily",
        headers=auth_headers(admin_token),
    )
    assert report.status_code == 200, report.text
    payload = report.json()
    assert float(payload["total_amount"]) >= 45.0
    assert any(item["insurance_provider"] == "TestInsurance" for item in payload["insurance_breakdown"])
