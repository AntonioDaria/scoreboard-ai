from unittest.mock import patch, MagicMock
from app.adapters.api_football_adapter import get_fixtures, get_standings, get_team_form, get_odds


MOCK_RESPONSE = {"response": [{"fixture": {"id": 1001}}]}


def _mock_get(endpoint, params=None):
    return MOCK_RESPONSE


def test_get_fixtures():
    with patch("app.adapters.api_football_adapter._get", side_effect=_mock_get):
        result = get_fixtures(39, 2024)
    assert result == MOCK_RESPONSE


def test_get_standings():
    with patch("app.adapters.api_football_adapter._get", side_effect=_mock_get):
        result = get_standings(39, 2024)
    assert result == MOCK_RESPONSE


def test_get_team_form():
    with patch("app.adapters.api_football_adapter._get", side_effect=_mock_get):
        result = get_team_form(33, last=5)
    assert result == MOCK_RESPONSE


def test_get_odds():
    with patch("app.adapters.api_football_adapter._get", side_effect=_mock_get):
        result = get_odds(1001)
    assert result == MOCK_RESPONSE
