from app.adapters.football_data_adapter import (
    get_competition_matches,
    get_match,
    get_match_h2h,
    get_standings,
    get_team_matches,
)


def fetch_fixtures(competition_code: str, status: str = "SCHEDULED", limit: int = 10) -> dict:
    return get_competition_matches(competition_code, status=status, limit=limit)


def fetch_fixture(match_id: int) -> dict:
    return get_match(match_id)


def fetch_h2h(match_id: int, limit: int = 5) -> dict:
    return get_match_h2h(match_id, limit=limit)


def fetch_standings(competition_code: str) -> dict:
    return get_standings(competition_code)


def fetch_team_form(team_id: int, limit: int = 5) -> dict:
    return get_team_matches(team_id, status="FINISHED", limit=limit)
