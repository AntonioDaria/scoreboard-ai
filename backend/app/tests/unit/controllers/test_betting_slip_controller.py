from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime
from main import app

client = TestClient(app)

MOCK_USER = MagicMock(id=1, email="test@example.com")


def test_create_slip():
    mock_slip = MagicMock()
    mock_slip.id = 1
    mock_slip.name = "My Slip"
    mock_slip.user_id = 1
    with patch("app.controllers.betting_slip_controller.auth_service.get_current_user", return_value=MOCK_USER), \
         patch("app.controllers.betting_slip_controller.betting_slip_service.create_slip", return_value=mock_slip):
        response = client.post(
            "/slips",
            json={"name": "My Slip"},
            headers={"Authorization": "Bearer mock_token"},
        )
    assert response.status_code == 201
    assert response.json()["name"] == "My Slip"
