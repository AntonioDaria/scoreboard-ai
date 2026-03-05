import pytest
from unittest.mock import patch, MagicMock
from app.services.prediction_service import create_prediction, get_prediction_by_id, get_remaining_predictions
from fastapi import HTTPException

MOCK_MATCH = {
    "id": 537093,
    "homeTeam": {"id": 33, "name": "Arsenal"},
    "awayTeam": {"id": 40, "name": "Chelsea"},
    "competition": {"code": "PL", "name": "Premier League"},
    "utcDate": "2026-04-01T19:00:00Z",
}

MOCK_AI = {
    "predicted_home_score": 2,
    "predicted_away_score": 1,
    "confidence": 0.72,
    "reasoning": "Strong home form.",
    "suggested_bet": "Home Win",
}


def test_create_prediction():
    db = MagicMock()
    db.query.return_value.filter.return_value.count.return_value = 0

    with patch("app.services.prediction_service.get_match", return_value=MOCK_MATCH), \
         patch("app.services.prediction_service.get_match_h2h", return_value={}), \
         patch("app.services.prediction_service.get_standings", return_value={"standings": [{"table": []}]}), \
         patch("app.services.prediction_service.get_team_matches", return_value={}), \
         patch("app.services.prediction_service.generate_prediction", return_value=MOCK_AI):
        create_prediction(1, 537093, db)

    db.add.assert_called_once()
    db.commit.assert_called_once()


def test_create_prediction_daily_limit_exceeded():
    db = MagicMock()
    db.query.return_value.filter.return_value.count.return_value = 5

    with pytest.raises(HTTPException) as exc:
        create_prediction(1, 537093, db)
    assert exc.value.status_code == 429


def test_get_remaining_predictions():
    db = MagicMock()
    db.query.return_value.filter.return_value.count.return_value = 3
    result = get_remaining_predictions(1, db)
    assert result["used"] == 3
    assert result["remaining"] == 2
    assert result["limit"] == 5


def test_get_prediction_by_id_not_found():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc:
        get_prediction_by_id(999, db)
    assert exc.value.status_code == 404
