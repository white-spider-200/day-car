import os
from collections.abc import Generator

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


@pytest.fixture()
def admin_token(client: TestClient) -> str:
    return login(client, "admin@sabina.dev", "Admin12345!")
