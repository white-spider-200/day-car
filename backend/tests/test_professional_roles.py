from tests.conftest import (
    auth_headers,
    register,
    submit_psychiatrist_application,
    submit_therapist_application,
)


def _approve_doctor_with_role(client, admin_token: str, email: str, role_type: str):
    register(client, email, "DoctorPass123!", "DOCTOR")
    doctor_token = client.post("/auth/login", json={"email": email, "password": "DoctorPass123!"}).json()[
        "access_token"
    ]
    if role_type == "PSYCHIATRIST":
        app = submit_psychiatrist_application(client, doctor_token)
    else:
        app = submit_therapist_application(client, doctor_token)
    approve = client.post(f"/admin/applications/{app['id']}/approve", headers=auth_headers(admin_token))
    assert approve.status_code == 200, approve.text
    return doctor_token, app["doctor_user_id"]


def _create_patient_relationship(client, doctor_token: str, doctor_user_id: str, user_email: str) -> str:
    register(client, user_email, "UserPass123!", "USER")
    user_token = client.post("/auth/login", json={"email": user_email, "password": "UserPass123!"}).json()[
        "access_token"
    ]
    create_request = client.post(
        "/treatment-requests",
        headers=auth_headers(user_token),
        json={"doctor_id": doctor_user_id, "message": "I need help."},
    )
    assert create_request.status_code == 200, create_request.text
    request_id = create_request.json()["id"]

    accept = client.patch(
        f"/treatment-requests/{request_id}",
        headers=auth_headers(doctor_token),
        json={"status": "ACCEPTED"},
    )
    assert accept.status_code == 200, accept.text
    return create_request.json()["user_id"]


def test_public_profile_role_badges_are_distinct(client, admin_token):
    _, psychiatrist_id = _approve_doctor_with_role(
        client, admin_token, "doctor-psy-role@testmail.dev", "PSYCHIATRIST"
    )
    _, therapist_id = _approve_doctor_with_role(
        client, admin_token, "doctor-ther-role@testmail.dev", "THERAPIST"
    )

    psychiatrist = client.get(f"/doctors/{psychiatrist_id}")
    assert psychiatrist.status_code == 200, psychiatrist.text
    psychiatrist_payload = psychiatrist.json()
    assert psychiatrist_payload["professional_type"] == "PSYCHIATRIST"
    assert psychiatrist_payload["can_prescribe_medication"] is True
    assert psychiatrist_payload["role_badge"]["color"] == "blue"
    assert "وصف الأدوية النفسية" in psychiatrist_payload["role_badge"]["clarification_note"]

    therapist = client.get(f"/doctors/{therapist_id}")
    assert therapist.status_code == 200, therapist.text
    therapist_payload = therapist.json()
    assert therapist_payload["professional_type"] == "THERAPIST"
    assert therapist_payload["can_prescribe_medication"] is False
    assert therapist_payload["role_badge"]["color"] == "green"
    assert "لا يملك صلاحية وصف الأدوية" in therapist_payload["role_badge"]["clarification_note"]


def test_backend_blocks_therapist_medical_entries(client, admin_token):
    therapist_token, therapist_id = _approve_doctor_with_role(
        client, admin_token, "doctor-therapist-medication@testmail.dev", "THERAPIST"
    )
    patient_user_id = _create_patient_relationship(
        client,
        therapist_token,
        therapist_id,
        "patient-therapy-prescription@testmail.dev",
    )

    create_record = client.post(
        "/doctor/patient-records",
        headers=auth_headers(therapist_token),
        json={"user_id": patient_user_id, "title": "Therapy plan"},
    )
    assert create_record.status_code == 200, create_record.text
    record_id = create_record.json()["id"]

    blocked_diagnosis = client.post(
        f"/records/{record_id}/entries",
        headers=auth_headers(therapist_token),
        json={"entry_type": "DIAGNOSIS", "content": "Generalized anxiety disorder symptoms observed."},
    )
    assert blocked_diagnosis.status_code == 403, blocked_diagnosis.text
    assert "Only psychiatrists" in blocked_diagnosis.json()["detail"]

    blocked_prescription = client.post(
        f"/records/{record_id}/entries",
        headers=auth_headers(therapist_token),
        json={"entry_type": "PRESCRIPTION", "content": "Sertraline 50mg daily"},
    )
    assert blocked_prescription.status_code == 403, blocked_prescription.text
    assert "Only psychiatrists" in blocked_prescription.json()["detail"]


def test_patient_profile_transfers_to_new_assigned_doctor(client, admin_token):
    doctor_1_token, doctor_1_id = _approve_doctor_with_role(
        client, admin_token, "doctor-transfer-1@testmail.dev", "PSYCHIATRIST"
    )
    doctor_2_token, doctor_2_id = _approve_doctor_with_role(
        client, admin_token, "doctor-transfer-2@testmail.dev", "THERAPIST"
    )

    register(client, "patient-transfer@testmail.dev", "UserPass123!", "USER")
    user_login = client.post(
        "/auth/login", json={"email": "patient-transfer@testmail.dev", "password": "UserPass123!"}
    )
    user_token = user_login.json()["access_token"]
    user_id = client.get("/auth/me", headers=auth_headers(user_token)).json()["id"]

    request_1 = client.post(
        "/treatment-requests",
        headers=auth_headers(user_token),
        json={"doctor_id": doctor_1_id, "message": "Need support from doctor 1."},
    )
    assert request_1.status_code == 200, request_1.text
    accept_1 = client.patch(
        f"/treatment-requests/{request_1.json()['id']}",
        headers=auth_headers(doctor_1_token),
        json={"status": "ACCEPTED"},
    )
    assert accept_1.status_code == 200, accept_1.text

    record_1 = client.post(
        "/doctor/patient-records",
        headers=auth_headers(doctor_1_token),
        json={"user_id": user_id, "title": "Private User Profile"},
    )
    assert record_1.status_code == 200, record_1.text
    record_payload_1 = record_1.json()
    record_id = record_payload_1["id"]
    assert record_payload_1["doctor_id"] == doctor_1_id

    request_2 = client.post(
        "/treatment-requests",
        headers=auth_headers(user_token),
        json={"doctor_id": doctor_2_id, "message": "Need support from doctor 2."},
    )
    assert request_2.status_code == 200, request_2.text
    accept_2 = client.patch(
        f"/treatment-requests/{request_2.json()['id']}",
        headers=auth_headers(doctor_2_token),
        json={"status": "ACCEPTED"},
    )
    assert accept_2.status_code == 200, accept_2.text

    transfer = client.post(
        "/doctor/patient-records",
        headers=auth_headers(doctor_2_token),
        json={"user_id": user_id, "title": "Private User Profile"},
    )
    assert transfer.status_code == 200, transfer.text
    transfer_payload = transfer.json()
    assert transfer_payload["id"] == record_id
    assert transfer_payload["doctor_id"] == doctor_2_id

    old_doctor_access = client.get(f"/records/{record_id}", headers=auth_headers(doctor_1_token))
    assert old_doctor_access.status_code == 403, old_doctor_access.text

    new_doctor_access = client.get(f"/records/{record_id}", headers=auth_headers(doctor_2_token))
    assert new_doctor_access.status_code == 200, new_doctor_access.text

    user_access = client.get(f"/records/{record_id}", headers=auth_headers(user_token))
    assert user_access.status_code == 200, user_access.text

    admin_access = client.get(f"/records/{record_id}", headers=auth_headers(admin_token))
    assert admin_access.status_code == 403, admin_access.text
