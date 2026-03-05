from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_register():
    mock_user = MagicMock(id=1, email="new@example.com")
    with patch("app.controllers.auth_controller.auth_service.register_user", return_value=mock_user):
        response = client.post("/auth/register", json={"email": "new@example.com", "password": "pass123"})
    assert response.status_code == 201
    assert response.json()["email"] == "new@example.com"


def test_login():
    with patch("app.controllers.auth_controller.auth_service.authenticate_user", return_value="mock_token"):
        response = client.post("/auth/login", json={"email": "test@example.com", "password": "pass123"})
    assert response.status_code == 200
    assert response.json()["access_token"] == "mock_token"
