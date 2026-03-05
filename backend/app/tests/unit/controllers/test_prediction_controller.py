from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime
from main import app
from app.controllers.prediction_controller import _current_user

client = TestClient(app)

MOCK_USER = MagicMock(id=1, email="test@example.com")
MOCK_PREDICTION = MagicMock(
    id=1,
    user_id=1,
    fixture_id=1001,
    home_team="Arsenal",
    away_team="Chelsea",
    league="Premier League",
    predicted_home_score=2,
    predicted_away_score=1,
    confidence=0.72,
    reasoning="Strong form.",
    suggested_bet="Home Win",
    created_at=datetime.utcnow(),
)


def test_create_prediction():
    app.dependency_overrides[_current_user] = lambda: MOCK_USER
    with patch("app.controllers.prediction_controller.prediction_service.create_prediction", return_value=MOCK_PREDICTION):
        response = client.post("/predictions", json={"fixture_id": 1001})
    app.dependency_overrides.clear()
    assert response.status_code == 201


def test_list_predictions():
    app.dependency_overrides[_current_user] = lambda: MOCK_USER
    with patch("app.controllers.prediction_controller.prediction_service.get_user_predictions", return_value=[MOCK_PREDICTION]):
        response = client.get("/predictions")
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert isinstance(response.json(), list)
