from sqlalchemy import select
from app.db.models import User
from app.db.session import SessionLocal
from tests.conftest import auth_headers, login, register


def test_register_login_and_me(client):
    res_user = register(client, "user1@test.local", "UserPass123!", "USER")
    assert res_user.status_code == 201, res_user.text

    res_doctor = register(client, "doctor1@test.local", "UserPass123!", "DOCTOR")
    assert res_doctor.status_code == 201, res_doctor.text

    token = login(client, "user1@test.local", "UserPass123!")
    me = client.get("/auth/me", headers=auth_headers(token))

    assert me.status_code == 200, me.text
    payload = me.json()
    assert payload["email"] == "user1@test.local"
    assert payload["role"] == "USER"


def test_login_with_invalid_password_hash_returns_401(client):
    register(client, "legacy@test.local", "UserPass123!", "USER")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "legacy@test.local"))
        assert user is not None
        user.password_hash = "not-a-valid-hash"
        db.commit()

    res = client.post("/auth/login", json={"email": "legacy@test.local", "password": "UserPass123!"})
    assert res.status_code == 401, res.text
