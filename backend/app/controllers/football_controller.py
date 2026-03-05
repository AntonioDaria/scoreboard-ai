from fastapi import APIRouter, Query
from app.services import football_service

router = APIRouter()


@router.get("/fixtures")
def fixtures(
    competition_code: str = Query(...),
    status: str = Query("SCHEDULED"),
    limit: int = Query(10),
):
    return football_service.fetch_fixtures(competition_code, status=status, limit=limit)


@router.get("/fixture/{match_id}")
def fixture(match_id: int):
    return football_service.fetch_fixture(match_id)


@router.get("/h2h/{match_id}")
def head_to_head(match_id: int, limit: int = Query(5)):
    return football_service.fetch_h2h(match_id, limit=limit)


@router.get("/standings/{competition_code}")
def standings(competition_code: str):
    return football_service.fetch_standings(competition_code)


@router.get("/team/{team_id}/form")
def team_form(team_id: int, limit: int = Query(5)):
    return football_service.fetch_team_form(team_id, limit=limit)
