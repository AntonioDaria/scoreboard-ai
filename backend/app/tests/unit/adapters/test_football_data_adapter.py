import time
from unittest.mock import patch, MagicMock
import httpx
import pytest

import app.adapters.football_data_adapter as fd_module
from app.adapters.football_data_adapter import (
    _get,
    get_competition_matches,
    get_match,
    get_match_h2h,
    get_standings,
    get_team_matches,
)


@pytest.fixture(autouse=True)
def clear_cache():
    fd_module._cache.clear()
    yield
    fd_module._cache.clear()


def _mock_response(status_code=200, json_data=None):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    resp.raise_for_status.return_value = None
    return resp


def _cache_key(endpoint, params=None):
    return endpoint + str(sorted((params or {}).items()))


def test_get_makes_http_request_and_returns_data():
    mock_resp = _mock_response(json_data={"matches": [{"id": 1}]})
    with patch("app.adapters.football_data_adapter.httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_resp
        result = _get("competitions/PL/matches")
    assert result == {"matches": [{"id": 1}]}


def test_get_returns_cached_data_when_fresh():
    mock_resp = _mock_response(json_data={"matches": []})
    with patch("app.adapters.football_data_adapter.httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_resp
        _get("competitions/PL/matches")
        _get("competitions/PL/matches")
        call_count = MockClient.return_value.__enter__.return_value.get.call_count
    assert call_count == 1  # second call served from cache


def test_get_returns_stale_cache_on_429():
    fd_module._cache[_cache_key("competitions/PL/matches")] = {
        "data": {"stale": True},
        "ts": time.time() - 600,
    }
    mock_429 = _mock_response(status_code=429)
    with patch("app.adapters.football_data_adapter.httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_429
        result = _get("competitions/PL/matches")
    assert result == {"stale": True}


def test_get_returns_empty_on_429_with_no_cache():
    mock_429 = _mock_response(status_code=429)
    with patch("app.adapters.football_data_adapter.httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.return_value = mock_429
        result = _get("competitions/PL/matches")
    assert result == {}


def test_get_returns_stale_cache_on_timeout():
    fd_module._cache[_cache_key("competitions/PL/matches")] = {
        "data": {"fallback": True},
        "ts": time.time() - 600,
    }
    with patch("app.adapters.football_data_adapter.httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.side_effect = httpx.TimeoutException("timeout")
        result = _get("competitions/PL/matches")
    assert result == {"fallback": True}


def test_get_returns_empty_on_timeout_with_no_cache():
    with patch("app.adapters.football_data_adapter.httpx.Client") as MockClient:
        MockClient.return_value.__enter__.return_value.get.side_effect = httpx.TimeoutException("timeout")
        result = _get("competitions/PL/matches")
    assert result == {}


def test_get_competition_matches_calls_correct_endpoint():
    with patch("app.adapters.football_data_adapter._get") as mock_get:
        mock_get.return_value = {}
        get_competition_matches("PL", status="SCHEDULED", limit=5)
    mock_get.assert_called_once_with("competitions/PL/matches", {"status": "SCHEDULED", "limit": 5})


def test_get_match_calls_correct_endpoint():
    with patch("app.adapters.football_data_adapter._get") as mock_get:
        mock_get.return_value = {}
        get_match(12345)
    mock_get.assert_called_once_with("matches/12345")


def test_get_match_h2h_calls_correct_endpoint():
    with patch("app.adapters.football_data_adapter._get") as mock_get:
        mock_get.return_value = {}
        get_match_h2h(12345, limit=3)
    mock_get.assert_called_once_with("matches/12345/head2head", {"limit": 3})


def test_get_standings_calls_correct_endpoint():
    with patch("app.adapters.football_data_adapter._get") as mock_get:
        mock_get.return_value = {}
        get_standings("PL")
    mock_get.assert_called_once_with("competitions/PL/standings")


def test_get_team_matches_calls_correct_endpoint():
    with patch("app.adapters.football_data_adapter._get") as mock_get:
        mock_get.return_value = {}
        get_team_matches(33, status="FINISHED", limit=5)
    mock_get.assert_called_once_with("teams/33/matches", {"status": "FINISHED", "limit": 5})
