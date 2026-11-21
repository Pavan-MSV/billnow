"""Shared pytest fixtures.

Environment variables are set *before* importing the application so the
settings singleton (and the rate limiter) pick up the test configuration.
"""

import os
import tempfile

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["JWT_SECRET"] = "test-secret-do-not-use-in-production"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["STORAGE_BACKEND"] = "local"
os.environ["STORAGE_LOCAL_DIR"] = tempfile.mkdtemp(prefix="billnow-test-storage-")
os.environ["EMAIL_ENABLED"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models  # noqa: E402,F401  (register models on metadata)
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    bind=engine, class_=Session, autocommit=False, autoflush=False, expire_on_commit=False
)


@pytest.fixture(autouse=True)
def _fresh_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def _override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register(client: TestClient, email: str = "user@example.com", password: str = "Password123"):
    response = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": email, "password": password},
    )
    assert response.status_code == 201, response.text
    return response.json()


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_token(client):
    data = register(client)
    return data["access_token"]


@pytest.fixture
def second_user_token(client):
    data = register(client, email="second@example.com")
    return data["access_token"]


def create_product(client, token, **overrides):
    payload = {
        "name": "Samsung 55 inch Smart TV",
        "category": "Television",
        "brand": "Samsung",
        "purchase_date": "2026-01-12",
        "purchase_price": 45000,
        "currency": "INR",
        "warranty_period_months": 24,
        "seller": "Croma",
        "invoice_number": "INV-12345",
    }
    payload.update(overrides)
    response = client.post("/api/products", json=payload, headers=auth_headers(token))
    assert response.status_code == 201, response.text
    return response.json()
