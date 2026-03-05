import pytest
from fastapi.testclient import TestClient
from main import app
from app.db.database import get_db

client = TestClient(app)


def test_register_login_flow(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        reg_response = client.post(
            "/auth/register",
            json={"email": "integration@example.com", "password": "testpass123"},
        )
        assert reg_response.status_code == 201

        login_response = client.post(
            "/auth/login",
            json={"email": "integration@example.com", "password": "testpass123"},
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()
    finally:
        app.dependency_overrides.clear()
