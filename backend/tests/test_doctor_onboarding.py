from io import BytesIO

from tests.conftest import auth_headers, register


def test_doctor_can_save_and_submit_and_save_blocked_after_submit(client, admin_token):
    register(client, "doctor2@test.local", "DoctorPass123!", "DOCTOR")
    doctor_token = client.post(
        "/auth/login", json={"email": "doctor2@test.local", "password": "DoctorPass123!"}
    ).json()["access_token"]

    save = client.post(
        "/doctor/application/save",
        headers=auth_headers(doctor_token),
        json={
            "display_name": "Dr One",
            "headline": "Trauma therapist",
            "specialties": ["Trauma"],
            "languages": ["English"],
            "session_types": ["VIDEO"],
            "pricing_currency": "JOD",
            "pricing_per_session": "50.00",
        },
    )
    assert save.status_code == 200, save.text
    assert save.json()["status"] == "DRAFT"

    submit = client.post("/doctor/application/submit", headers=auth_headers(doctor_token))
    assert submit.status_code == 200, submit.text
    assert submit.json()["status"] == "SUBMITTED"

    save_again = client.post(
        "/doctor/application/save",
        headers=auth_headers(doctor_token),
        json={"headline": "Updated"},
    )
    assert save_again.status_code == 400

    app = client.get("/doctor/application", headers=auth_headers(doctor_token)).json()
    request_changes = client.post(
        f"/admin/applications/{app['id']}/request-changes",
        headers=auth_headers(admin_token),
        json={"notes": "Please update headline"},
    )
    assert request_changes.status_code == 200, request_changes.text

    save_after_changes = client.post(
        "/doctor/application/save",
        headers=auth_headers(doctor_token),
        json={"headline": "Updated after review"},
    )
    assert save_after_changes.status_code == 200, save_after_changes.text


def test_document_upload_and_admin_set_status(client, admin_token):
    register(client, "doctor3@test.local", "DoctorPass123!", "DOCTOR")
    doctor_login = client.post(
        "/auth/login", json={"email": "doctor3@test.local", "password": "DoctorPass123!"}
    )
    doctor_token = doctor_login.json()["access_token"]

    upload = client.post(
        "/doctor/documents/upload",
        headers=auth_headers(doctor_token),
        data={"type": "LICENSE"},
        files={"file": ("license.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    doc_id = upload.json()["id"]

    admin_set = client.post(
        f"/admin/documents/{doc_id}/set-status",
        headers=auth_headers(admin_token),
        json={"status": "ACCEPTED", "comment": "Verified"},
    )
    assert admin_set.status_code == 200, admin_set.text
    assert admin_set.json()["status"] == "ACCEPTED"
