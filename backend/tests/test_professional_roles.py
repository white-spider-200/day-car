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


def test_backend_blocks_therapist_prescription_entries(client, admin_token):
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

    diagnosis_entry = client.post(
        f"/records/{record_id}/entries",
        headers=auth_headers(therapist_token),
        json={"entry_type": "DIAGNOSIS", "content": "Generalized anxiety disorder symptoms observed."},
    )
    assert diagnosis_entry.status_code == 200, diagnosis_entry.text

    blocked_prescription = client.post(
        f"/records/{record_id}/entries",
        headers=auth_headers(therapist_token),
        json={"entry_type": "PRESCRIPTION", "content": "Sertraline 50mg daily"},
    )
    assert blocked_prescription.status_code == 403, blocked_prescription.text
    assert "Only psychiatrists" in blocked_prescription.json()["detail"]

