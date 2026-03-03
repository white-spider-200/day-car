import os
from collections.abc import Generator
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

# Must be set before importing app modules that read settings.
os.environ.setdefault(
    "DATABASE_URL",
    os.getenv(
        "TEST_DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5433/doctrs_test",
    ),
)
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("SEED_ADMIN_EMAIL", "admin@sabina.dev")
os.environ.setdefault("SEED_ADMIN_PASSWORD", "Admin12345!")

from app.db.base import Base  # noqa: E402
from app.core.security import auth_rate_limiter  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    database_url = os.environ["DATABASE_URL"]
    engine = create_engine(database_url)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    auth_rate_limiter.reset()

    with TestClient(app) as c:
        yield c

    auth_rate_limiter.reset()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def register(client: TestClient, email: str, password: str, role: str):
    return client.post(
        "/auth/register",
        json={"email": email, "password": password, "role": role},
    )


def login(client: TestClient, email: str, password: str) -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def submit_psychiatrist_application(
    client: TestClient, doctor_token: str, save_overrides: dict | None = None
):
    payload = {
        "professional_type": "PSYCHIATRIST",
        "display_name": "Approved Psychiatrist",
        "headline": "Psychiatry profile",
        "license_number": "PSY-12345",
        "license_issuing_authority": "Jordan Medical Council",
        "license_expiry_date": "2028-12-31",
        "legal_prescription_declaration": "I am legally authorized to prescribe psychiatric medication.",
        "psychiatrist_prescription_ack": True,
        "specialties": ["Psychiatry"],
        "concerns": ["Anxiety"],
        "therapy_approaches": ["CBT"],
        "languages": ["English"],
        "session_types": ["VIDEO"],
        "pricing_per_session": "70.00",
    }
    if save_overrides:
        payload.update(save_overrides)

    save = client.post("/doctor/application/save", headers=auth_headers(doctor_token), json=payload)
    assert save.status_code == 200, save.text

    for doc_type in ["MEDICAL_DEGREE", "PSYCHIATRY_SPECIALIZATION", "ACTIVE_PRACTICE_PROOF"]:
        upload = client.post(
            "/doctor/documents/upload",
            headers=auth_headers(doctor_token),
            data={"type": doc_type},
            files={"file": ("proof.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")},
        )
        assert upload.status_code == 201, upload.text

    submit = client.post("/doctor/application/submit", headers=auth_headers(doctor_token))
    assert submit.status_code == 200, submit.text
    return client.get("/doctor/application", headers=auth_headers(doctor_token)).json()


def submit_therapist_application(
    client: TestClient, doctor_token: str, save_overrides: dict | None = None
):
    payload = {
        "professional_type": "THERAPIST",
        "display_name": "Approved Therapist",
        "headline": "Therapy profile",
        "accreditation_body": "Jordan Therapy Board",
        "no_prescription_declaration": "I do not have authority to prescribe medication.",
        "therapist_no_prescription_ack": True,
        "specialties": ["Therapy"],
        "concerns": ["Anxiety"],
        "therapy_approaches": ["CBT"],
        "languages": ["English"],
        "session_types": ["VIDEO"],
        "years_experience": 5,
        "pricing_per_session": "60.00",
    }
    if save_overrides:
        payload.update(save_overrides)

    save = client.post("/doctor/application/save", headers=auth_headers(doctor_token), json=payload)
    assert save.status_code == 200, save.text

    for doc_type in ["THERAPY_SPECIALIZATION", "SPECIALIZATION_CERTIFICATE"]:
        upload = client.post(
            "/doctor/documents/upload",
            headers=auth_headers(doctor_token),
            data={"type": doc_type},
            files={"file": ("proof.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")},
        )
        assert upload.status_code == 201, upload.text

    submit = client.post("/doctor/application/submit", headers=auth_headers(doctor_token))
    assert submit.status_code == 200, submit.text
    return client.get("/doctor/application", headers=auth_headers(doctor_token)).json()


@pytest.fixture()
def admin_token(client: TestClient) -> str:
    return login(client, "admin@sabina.dev", "Admin12345!")
