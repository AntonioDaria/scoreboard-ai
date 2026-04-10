"""FastAPI router for football data endpoints: fixtures, standings, form, h2h, and lineups."""
import logging
from fastapi import APIRouter, Query
from app.services import football_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/fixtures")
def fixtures(
    competition_code: str = Query(...),
    status: str = Query("SCHEDULED"),
    limit: int = Query(10),
):
    """Return fixtures for a competition filtered by status."""
    return football_service.fetch_fixtures(competition_code, status=status, limit=limit)


@router.get("/fixture/{match_id}")
def fixture(match_id: int):
    """Return full details for a single match."""
    return football_service.fetch_fixture(match_id)


@router.get("/h2h/{match_id}")
def head_to_head(match_id: int, limit: int = Query(5)):
    """Return head-to-head history for the two teams in a match."""
    return football_service.fetch_h2h(match_id, limit=limit)


@router.get("/standings/{competition_code}")
def standings(competition_code: str):
    """Return the current standings table for a competition."""
    return football_service.fetch_standings(competition_code)


@router.get("/team/{team_id}/form")
def team_form(team_id: int, limit: int = Query(5)):
    """Return a team's most recent finished matches."""
    return football_service.fetch_team_form(team_id, limit=limit)


@router.get("/lineups")
def lineups(
    home_team: str = Query(...),
    away_team: str = Query(...),
    match_date: str = Query(...),
    competition_code: str = Query(None),
):
    """Return confirmed starting lineups for a fixture sourced from ESPN."""
    return football_service.fetch_lineups(home_team, away_team, match_date, competition_code)
