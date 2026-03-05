import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.football-data.org/v4"
API_KEY = os.getenv("FOOTBALL_DATA_KEY", "")
HEADERS = {"X-Auth-Token": API_KEY}

_cache: dict = {}
CACHE_TTL = 300  # 5 minutes


def _get(endpoint: str, params: dict = None) -> dict:
    key = endpoint + str(sorted((params or {}).items()))
    cached = _cache.get(key)
    if cached and time.time() - cached["ts"] < CACHE_TTL:
        return cached["data"]
    with httpx.Client() as client:
        response = client.get(f"{BASE_URL}/{endpoint}", headers=HEADERS, params=params or {})
        response.raise_for_status()
        data = response.json()
    _cache[key] = {"data": data, "ts": time.time()}
    return data


def get_competition_matches(competition_code: str, status: str = "SCHEDULED", limit: int = 10) -> dict:
    return _get(f"competitions/{competition_code}/matches", {"status": status, "limit": limit})


def get_match(match_id: int) -> dict:
    return _get(f"matches/{match_id}")


def get_match_h2h(match_id: int, limit: int = 5) -> dict:
    return _get(f"matches/{match_id}/head2head", {"limit": limit})


def get_standings(competition_code: str) -> dict:
    return _get(f"competitions/{competition_code}/standings")


def get_team_matches(team_id: int, status: str = "FINISHED", limit: int = 5) -> dict:
    return _get(f"teams/{team_id}/matches", {"status": status, "limit": limit})
