"""Thin service layer that delegates football data requests to the appropriate adapters."""
import logging
from app.adapters.football_data_adapter import (
    get_competition_matches,
    get_match,
    get_match_h2h,
    get_standings,
    get_team_matches,
)
from app.adapters.espn_adapter import get_lineups as espn_get_lineups

logger = logging.getLogger(__name__)


def fetch_fixtures(competition_code: str, status: str = "SCHEDULED", limit: int = 10) -> dict:
    """Return upcoming or filtered fixtures for a competition."""
    return get_competition_matches(competition_code, status=status, limit=limit)


def fetch_fixture(match_id: int) -> dict:
    """Return full details for a single match."""
    return get_match(match_id)


def fetch_h2h(match_id: int, limit: int = 5) -> dict:
    """Return head-to-head history for the two teams in a match."""
    return get_match_h2h(match_id, limit=limit)


def fetch_standings(competition_code: str) -> dict:
    """Return the current standings table for a competition."""
    return get_standings(competition_code)


def fetch_team_form(team_id: int, limit: int = 5) -> dict:
    """Return a team's most recent finished matches for form analysis."""
    return get_team_matches(team_id, status="FINISHED", limit=limit)


def fetch_lineups(home_team: str, away_team: str, match_date: str, competition_code: str | None = None) -> dict:
    """Return confirmed starting lineups for a fixture, sourced from ESPN."""
    return espn_get_lineups(home_team, away_team, match_date, competition_code)
