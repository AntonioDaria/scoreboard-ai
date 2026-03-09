import json
from unittest.mock import patch, MagicMock
from app.adapters.claude_adapter import generate_prediction, _statistical_prediction, _form_score

MOCK_PREDICTION = {
    "predicted_home_score": 2,
    "predicted_away_score": 1,
    "confidence": 0.72,
    "reasoning": "Home team strong form.",
    "suggested_bet": "Home Win",
}

MATCH_CONTEXT = {
    "fixture_id": 1001,
    "home_team": "Arsenal",
    "away_team": "Chelsea",
    "home_team_id": 33,
    "away_team_id": 40,
    "home_league_rank": 1,
    "away_league_rank": 5,
    "head_to_head": {},
    "home_recent_matches": {},
    "away_recent_matches": {},
}


def test_generate_prediction_uses_claude():
    mock_content = MagicMock()
    mock_content.text = json.dumps(MOCK_PREDICTION)
    mock_content.type = "text"
    mock_message = MagicMock()
    mock_message.content = [mock_content]
    mock_message.stop_reason = "end_turn"

    with patch("app.adapters.claude_adapter.client") as mock_client:
        mock_client.messages.create.return_value = mock_message
        result = generate_prediction(MATCH_CONTEXT)

    assert result["predicted_home_score"] == 2
    assert result["suggested_bet"] == "Home Win"
    assert 0 <= result["confidence"] <= 1
    assert "home_injuries" in result
    assert "away_injuries" in result


def test_generate_prediction_falls_back_on_claude_error():
    with patch("app.adapters.claude_adapter.client") as mock_client:
        mock_client.messages.create.side_effect = Exception("API error")
        result = generate_prediction(MATCH_CONTEXT)

    assert "predicted_home_score" in result
    assert "predicted_away_score" in result
    assert 0 <= result["confidence"] <= 1
    assert "statistical" in result["reasoning"].lower() or "⚠️" in result["reasoning"]


def test_statistical_prediction_returns_valid_structure():
    result = _statistical_prediction(MATCH_CONTEXT)
    assert isinstance(result["predicted_home_score"], int)
    assert isinstance(result["predicted_away_score"], int)
    assert 0 <= result["confidence"] <= 1
    assert result["suggested_bet"] in ("Home Win", "Away Win", "Draw")
    assert "⚠️" in result["reasoning"]


def test_form_score_all_wins():
    matches = {"matches": [
        {"homeTeam": {"id": 33}, "score": {"winner": "HOME_TEAM"}},
        {"homeTeam": {"id": 33}, "score": {"winner": "HOME_TEAM"}},
    ]}
    assert _form_score(matches, 33) == 1.0


def test_form_score_all_losses():
    matches = {"matches": [
        {"homeTeam": {"id": 33}, "score": {"winner": "AWAY_TEAM"}},
        {"homeTeam": {"id": 33}, "score": {"winner": "AWAY_TEAM"}},
    ]}
    assert _form_score(matches, 33) == 0.0


def test_form_score_empty():
    assert _form_score({}, 33) == 0.5
