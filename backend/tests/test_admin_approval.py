from io import BytesIO

from tests.conftest import auth_headers, register


def _create_submitted_application(client, email: str):
    register(client, email, "DoctorPass123!", "DOCTOR")
    token = client.post("/auth/login", json={"email": email, "password": "DoctorPass123!"}).json()[
        "access_token"
    ]
    save = client.post(
        "/doctor/application/save",
        headers=auth_headers(token),
        json={
            "professional_type": "PSYCHIATRIST",
            "display_name": "Dr Approved",
            "license_number": "APP-PSY-1",
            "license_issuing_authority": "Jordan Medical Council",
            "license_expiry_date": "2028-12-31",
            "legal_prescription_declaration": "I am legally authorized to prescribe psychiatric medication.",
            "psychiatrist_prescription_ack": True,
            "headline": "CBT specialist",
            "specialties": ["CBT"],
            "concerns": ["Anxiety"],
            "therapy_approaches": ["CBT"],
            "languages": ["Arabic"],
            "session_types": ["VIDEO"],
            "gender_identity": "Female",
            "insurance_providers": ["MedNet"],
            "pricing_per_session": "80.00",
        },
    )
    assert save.status_code == 200, save.text
    for doc_type in ["MEDICAL_DEGREE", "PSYCHIATRY_SPECIALIZATION", "ACTIVE_PRACTICE_PROOF"]:
        upload = client.post(
            "/doctor/documents/upload",
            headers=auth_headers(token),
            data={"type": doc_type},
            files={"file": ("proof.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")},
        )
        assert upload.status_code == 201, upload.text
    submit = client.post("/doctor/application/submit", headers=auth_headers(token))
    assert submit.status_code == 200, submit.text
    app = client.get("/doctor/application", headers=auth_headers(token)).json()
    return token, app["id"], app["doctor_user_id"]


def test_admin_can_list_and_approve_application(client, admin_token):
    _, app_id, doctor_user_id = _create_submitted_application(client, "doctor4@testmail.dev")

    list_res = client.get("/admin/applications", headers=auth_headers(admin_token))
    assert list_res.status_code == 200, list_res.text
    assert any(item["id"] == app_id for item in list_res.json())

    approve = client.post(
        f"/admin/applications/{app_id}/approve", headers=auth_headers(admin_token)
    )
    assert approve.status_code == 200, approve.text
    assert approve.json()["status"] == "APPROVED"

    profile = client.get(f"/doctors/{doctor_user_id}")
    assert profile.status_code == 200, profile.text
    assert profile.json()["is_public"] is True
    assert "VERIFIED_DOCTOR" in (profile.json().get("verification_badges") or [])
    assert "Anxiety" in (profile.json().get("concerns") or [])
    assert "CBT" in (profile.json().get("therapy_approaches") or [])
    assert "MedNet" in (profile.json().get("insurance_providers") or [])


def test_admin_reject_and_request_changes(client, admin_token):
    _, app_id, _ = _create_submitted_application(client, "doctor5@testmail.dev")

    reject = client.post(
        f"/admin/applications/{app_id}/reject",
        headers=auth_headers(admin_token),
        json={"reason": "Missing documents"},
    )
    assert reject.status_code == 200, reject.text
    assert reject.json()["status"] == "REJECTED"
    assert reject.json()["rejection_reason"] == "Missing documents"

    _, app_id_2, _ = _create_submitted_application(client, "doctor6@testmail.dev")
    needs_changes = client.post(
        f"/admin/applications/{app_id_2}/request-changes",
        headers=auth_headers(admin_token),
        json={"notes": "Please complete bio"},
    )
    assert needs_changes.status_code == 200, needs_changes.text
    assert needs_changes.json()["status"] == "NEEDS_CHANGES"


def test_security_user_and_doctor_cannot_access_admin_endpoints(client, admin_token):
    register(client, "user-sec@testmail.dev", "UserPass123!", "USER")
    user_token = client.post(
        "/auth/login", json={"email": "user-sec@testmail.dev", "password": "UserPass123!"}
    ).json()["access_token"]

    register(client, "doctor-sec@testmail.dev", "DoctorPass123!", "DOCTOR")
    doctor_token = client.post(
        "/auth/login", json={"email": "doctor-sec@testmail.dev", "password": "DoctorPass123!"}
    ).json()["access_token"]

    user_forbidden = client.get("/admin/applications", headers=auth_headers(user_token))
    assert user_forbidden.status_code == 403

    doctor_forbidden = client.get("/admin/applications", headers=auth_headers(doctor_token))
    assert doctor_forbidden.status_code == 403
