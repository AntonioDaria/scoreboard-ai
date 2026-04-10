"""HTTP adapter for the api-sports.io football API, providing fixtures, standings, form, injuries, lineups, and odds."""
import logging
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

BASE_URL = "https://v3.football.api-sports.io"
API_KEY = os.getenv("API_FOOTBALL_KEY", "")

HEADERS = {
    "x-apisports-key": API_KEY,
}


def _get(endpoint: str, params: dict = None) -> dict:
    """Make an authenticated GET request to an api-sports.io endpoint and return the JSON response."""
    with httpx.Client() as client:
        response = client.get(f"{BASE_URL}/{endpoint}", headers=HEADERS, params=params or {})
        response.raise_for_status()
        return response.json()


def get_fixtures(
    league_id: int = None,
    season: int = None,
    fixture_id: int = None,
    next: int = None,
    from_date: str = None,
    to_date: str = None,
) -> dict:
    """Return fixtures matching the given filters; supports lookup by id, next N, or date range."""
    params = {}
    if fixture_id is not None:
        params["id"] = fixture_id
    elif next is not None:
        params["league"] = league_id
        params["next"] = next
    else:
        params["league"] = league_id
        if season is not None:
            params["season"] = season
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
    return _get("fixtures", params)


def get_standings(league_id: int, season: int) -> dict:
    """Return the current league standings for a given league and season."""
    return _get("standings", {"league": league_id, "season": season})


def get_team_form(team_id: int, last: int = 5) -> dict:
    """Return a team's most recent N fixtures for form analysis."""
    return _get("fixtures", {"team": team_id, "last": last})


def get_injuries(team_id: int, fixture_id: int) -> dict:
    """Return the injury report for a team ahead of a specific fixture."""
    return _get("injuries", {"team": team_id, "fixture": fixture_id})


def get_lineup(fixture_id: int) -> dict:
    """Return the confirmed or expected starting lineup for a fixture."""
    return _get("fixtures/lineups", {"fixture": fixture_id})


def get_head_to_head(team1_id: int, team2_id: int) -> dict:
    """Return historical head-to-head results between two teams."""
    return _get("fixtures/headtohead", {"h2h": f"{team1_id}-{team2_id}"})


def get_odds(fixture_id: int) -> dict:
    """Return bookmaker odds for a fixture."""
    return _get("odds", {"fixture": fixture_id})
