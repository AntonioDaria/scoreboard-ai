from unittest.mock import patch
from app.services.football_service import fetch_fixtures, fetch_standings, fetch_team_form

MOCK = {"matches": []}


def test_fetch_fixtures():
    with patch("app.services.football_service.get_competition_matches", return_value=MOCK):
        assert fetch_fixtures("PL") == MOCK


def test_fetch_standings():
    with patch("app.services.football_service.get_standings", return_value=MOCK):
        assert fetch_standings("PL") == MOCK


def test_fetch_team_form():
    with patch("app.services.football_service.get_team_matches", return_value=MOCK):
        assert fetch_team_form(33) == MOCK
