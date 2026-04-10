from unittest.mock import patch, MagicMock

from app.adapters.espn_adapter import (
    _names_match,
    _normalize,
    _parse_lineup,
    get_lineups,
)


def test_normalize_lowercases_and_trims():
    assert _normalize("  Arsenal FC  ") == "arsenal fc"


def test_normalize_collapses_whitespace():
    assert _normalize("Manchester  City") == "manchester city"


def test_names_match_exact():
    assert _names_match("Arsenal FC", "Arsenal FC") is True


def test_names_match_substring_forward():
    assert _names_match("Arsenal", "Arsenal FC") is True


def test_names_match_substring_reverse():
    assert _names_match("Arsenal FC", "Arsenal") is True


def test_names_match_no_match():
    assert _names_match("Arsenal", "Chelsea") is False


def test_parse_lineup_extracts_starters_only():
    roster = {
        "formation": "4-3-3",
        "roster": [
            {"starter": True, "athlete": {"displayName": "Raya"}, "position": {"abbreviation": "GK"}, "jersey": "22"},
            {"starter": True, "athlete": {"displayName": "White"}, "position": {"abbreviation": "DEF"}, "jersey": "2"},
            {"starter": False, "athlete": {"displayName": "Sub"}, "position": {"abbreviation": "MID"}, "jersey": "99"},
        ],
    }
    result = _parse_lineup(roster)
    assert result["formation"] == "4-3-3"
    assert len(result["players"]) == 2
    assert result["players"][0]["name"] == "Raya"
    assert result["players"][0]["position"] == "GK"
    assert result["players"][0]["number"] == 22


def test_parse_lineup_detects_gk_abbreviation_g():
    roster = {
        "formation": "4-4-2",
        "roster": [
            {"starter": True, "athlete": {"displayName": "Keeper"}, "position": {"abbreviation": "G"}, "jersey": "1"},
            {"starter": True, "athlete": {"displayName": "Outfield"}, "position": {"abbreviation": "DEF"}, "jersey": "5"},
        ],
    }
    result = _parse_lineup(roster)
    assert result["players"][0]["position"] == "GK"
    assert result["players"][1]["position"] == "OUT"


def test_parse_lineup_defaults_formation_when_missing():
    result = _parse_lineup({"roster": []})
    assert result["formation"] == "4-4-2"
    assert result["players"] == []


def test_parse_lineup_handles_invalid_jersey():
    roster = {
        "formation": "4-4-2",
        "roster": [
            {"starter": True, "athlete": {"displayName": "Player"}, "position": {"abbreviation": "GK"}, "jersey": "abc"},
        ],
    }
    result = _parse_lineup(roster)
    assert result["players"][0]["number"] == 1  # falls back to iteration counter


def test_get_lineups_returns_none_none_when_event_not_found():
    with patch("app.adapters.espn_adapter.httpx.Client") as MockClient:
        mock_c = MockClient.return_value.__enter__.return_value
        mock_scoreboard = MagicMock()
        mock_scoreboard.status_code = 200
        mock_scoreboard.json.return_value = {"events": []}
        mock_c.get.return_value = mock_scoreboard

        result = get_lineups("Arsenal FC", "Chelsea FC", "20240101", "PL")

    assert result == {"home": None, "away": None}


def test_get_lineups_normalises_dashed_date_format():
    # _find_event receives (client, league_slug, espn_date, home_team, away_team)
    with patch("app.adapters.espn_adapter._find_event", return_value=None) as mock_find:
        with patch("app.adapters.espn_adapter.httpx.Client"):
            get_lineups("Arsenal FC", "Chelsea FC", "2024-01-01", "PL")
    assert mock_find.call_args[0][2] == "20240101"


def test_get_lineups_returns_none_none_on_exception():
    with patch("app.adapters.espn_adapter.httpx.Client") as MockClient:
        MockClient.return_value.__enter__.side_effect = Exception("network failure")
        result = get_lineups("Arsenal FC", "Chelsea FC", "20240101", "PL")
    assert result == {"home": None, "away": None}
