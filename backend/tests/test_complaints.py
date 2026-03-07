from tests.conftest import auth_headers, login, register


def test_user_and_doctor_can_submit_and_admin_can_review(client, admin_token):
    register(client, "complaint-user@testmail.dev", "UserPass123!", "USER")
    user_token = login(client, "complaint-user@testmail.dev", "UserPass123!")

    register(client, "complaint-doctor@testmail.dev", "DoctorPass123!", "DOCTOR")
    doctor_token = login(client, "complaint-doctor@testmail.dev", "DoctorPass123!")

    user_submit = client.post(
        "/complaints",
        headers=auth_headers(user_token),
        json={"subject": "User Issue", "text": "I have a complaint as a user."},
    )
    assert user_submit.status_code == 201, user_submit.text
    assert user_submit.json()["reporter_role"] == "USER"
    assert user_submit.json()["status"] == "NEW"

    doctor_submit = client.post(
        "/complaints",
        headers=auth_headers(doctor_token),
        json={"subject": "Doctor Issue", "text": "I have a complaint as a doctor."},
    )
    assert doctor_submit.status_code == 201, doctor_submit.text
    assert doctor_submit.json()["reporter_role"] == "DOCTOR"

    admin_list = client.get("/admin/complaints", headers=auth_headers(admin_token))
    assert admin_list.status_code == 200, admin_list.text
    payload = admin_list.json()
    assert len(payload) >= 2

    user_row = next((item for item in payload if item["reporter_email"] == "complaint-user@testmail.dev"), None)
    assert user_row is not None
    assert user_row["reporter_role"] == "USER"
    assert "complaint as a user" in user_row["text"]

    doctor_row = next((item for item in payload if item["reporter_email"] == "complaint-doctor@testmail.dev"), None)
    assert doctor_row is not None
    assert doctor_row["reporter_role"] == "DOCTOR"
    assert "complaint as a doctor" in doctor_row["text"]

    review = client.patch(
        f"/admin/complaints/{doctor_row['id']}/reviewed",
        headers=auth_headers(admin_token),
    )
    assert review.status_code == 200, review.text
    assert review.json()["status"] == "REVIEWED"
