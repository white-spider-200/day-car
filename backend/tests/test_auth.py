from sqlalchemy import select
from app.db.models import User
from app.db.session import SessionLocal
from tests.conftest import auth_headers, login, register


def test_register_login_and_me(client):
    res_user = register(client, "user1@testmail.dev", "UserPass123!", "USER")
    assert res_user.status_code == 201, res_user.text

    res_doctor = register(client, "doctor1@testmail.dev", "UserPass123!", "DOCTOR")
    assert res_doctor.status_code == 201, res_doctor.text

    token = login(client, "user1@testmail.dev", "UserPass123!")
    me = client.get("/auth/me", headers=auth_headers(token))

    assert me.status_code == 200, me.text
    payload = me.json()
    assert payload["email"] == "user1@testmail.dev"
    assert payload["role"] == "USER"


def test_login_with_invalid_password_hash_returns_401(client):
    register(client, "legacy@testmail.dev", "UserPass123!", "USER")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "legacy@testmail.dev"))
        assert user is not None
        user.password_hash = "not-a-valid-hash"
        db.commit()

    res = client.post("/auth/login", json={"email": "legacy@testmail.dev", "password": "UserPass123!"})
    assert res.status_code == 401, res.text


def test_request_and_verify_login_code_with_email(client):
    register(client, "otp-user@testmail.dev", "UserPass123!", "USER")

    request_code = client.post("/auth/request-login-code", json={"email": "otp-user@testmail.dev"})
    assert request_code.status_code == 200, request_code.text

    payload = request_code.json()
    assert payload["delivery_channel"] == "EMAIL"
    assert payload.get("debug_code")

    verify = client.post(
        "/auth/verify-login-code",
        json={"email": "otp-user@testmail.dev", "code": payload["debug_code"]},
    )
    assert verify.status_code == 200, verify.text
    assert verify.json()["access_token"]


def test_verify_login_code_rejects_invalid_code(client):
    register(client, "otp-invalid@testmail.dev", "UserPass123!", "USER")

    request_code = client.post("/auth/request-login-code", json={"email": "otp-invalid@testmail.dev"})
    assert request_code.status_code == 200, request_code.text

    verify = client.post(
        "/auth/verify-login-code",
        json={"email": "otp-invalid@testmail.dev", "code": "000000"},
    )
    assert verify.status_code == 401, verify.text
