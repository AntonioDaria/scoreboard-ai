"""HTTP adapter for the ESPN public API, used to fetch confirmed team lineups for upcoming and live fixtures."""
import logging
import httpx
import re

logger = logging.getLogger(__name__)

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer"

# football-data.org competition code → ESPN league slug
_LEAGUE_MAP = {
    "PL": "eng.1",
    "PD": "esp.1",
    "SA": "ita.1",
    "BL1": "ger.1",
    "FL1": "fra.1",
}

# All ESPN slugs to try when competition code is unknown
_ALL_LEAGUES = list(_LEAGUE_MAP.values())

# ESPN position → simplified position (only GK matters for the pitch render)
_GK_POSITIONS = {"G", "GK"}


def _normalize(name: str) -> str:
    """Lowercase and collapse whitespace in a team name to make fuzzy comparison reliable."""
    name = name.lower().strip()
    for suffix in [" fc", " afc", " cf", " sc", " ac", " united", " city"]:
        pass  # don't strip these — use substring matching instead
    return re.sub(r"\s+", " ", name)


def _names_match(fd_name: str, espn_name: str) -> bool:
    """Return True if football-data team name matches ESPN team name."""
    a = _normalize(fd_name)
    b = _normalize(espn_name)
    return a in b or b in a


def _find_event(
    client: httpx.Client,
    league_slug: str,
    espn_date: str,
    home_team: str,
    away_team: str,
) -> str | None:
    """Return ESPN event_id if we find the match on a given date in a league."""
    res = client.get(
        f"{ESPN_BASE}/{league_slug}/scoreboard",
        params={"dates": espn_date},
    )
    if res.status_code != 200:
        return None
    events = res.json().get("events", [])
    for event in events:
        competitors = []
        for comp in event.get("competitions", []):
            competitors.extend(comp.get("competitors", []))
        espn_teams = [c.get("team", {}).get("displayName", "") for c in competitors]
        if any(_names_match(home_team, t) for t in espn_teams) and any(
            _names_match(away_team, t) for t in espn_teams
        ):
            return event["id"]
    return None


def _parse_lineup(roster_data: dict) -> dict:
    """Parse ESPN roster dict into our lineup format."""
    formation = roster_data.get("formation") or "4-4-2"
    players_raw = roster_data.get("roster", [])

    starters = [p for p in players_raw if p.get("starter")]

    players = []
    number = 1
    for p in starters:
        athlete = p.get("athlete", {})
        pos_info = p.get("position", {})
        pos_abbr = pos_info.get("abbreviation", "")

        position = "GK" if pos_abbr in _GK_POSITIONS else "OUT"
        jersey = p.get("jersey")
        try:
            num = int(jersey) if jersey is not None else number
        except (ValueError, TypeError):
            num = number

        players.append(
            {
                "name": athlete.get("displayName", f"Player {number}"),
                "number": num,
                "position": position,
            }
        )
        number += 1

    return {"formation": formation, "players": players}


def get_lineups(
    home_team: str,
    away_team: str,
    match_date: str,
    competition_code: str | None = None,
) -> dict:
    """Fetch lineups from ESPN.

    Args:
        home_team: team name as in football-data.org (e.g. "Arsenal FC")
        away_team: team name
        match_date: date string in format YYYYMMDD or YYYY-MM-DD
        competition_code: football-data.org code like "PL" (optional, speeds up search)

    Returns:
        {"home": {...}, "away": {...}} or {"home": None, "away": None}
    """
    espn_date = match_date.replace("-", "")  # normalise to YYYYMMDD

    leagues_to_try = (
        [_LEAGUE_MAP[competition_code]] if competition_code in _LEAGUE_MAP else _ALL_LEAGUES
    )

    event_id: str | None = None
    league_slug: str | None = None

    try:
        with httpx.Client(follow_redirects=True, timeout=10) as c:
            for slug in leagues_to_try:
                event_id = _find_event(c, slug, espn_date, home_team, away_team)
                if event_id:
                    league_slug = slug
                    break

            if not event_id or not league_slug:
                logger.warning(
                    "ESPN event not found for match",
                    extra={"home_team": home_team, "away_team": away_team, "match_date": match_date},
                )
                return {"home": None, "away": None}

            res = c.get(
                f"{ESPN_BASE}/{league_slug}/summary",
                params={"event": event_id},
            )
            if res.status_code != 200:
                return {"home": None, "away": None}

            rosters = res.json().get("rosters", [])
            if not rosters:
                return {"home": None, "away": None}

            home_roster = None
            away_roster = None
            for r in rosters:
                team_name = r.get("team", {}).get("displayName", "")
                if _names_match(home_team, team_name):
                    home_roster = r
                elif _names_match(away_team, team_name):
                    away_roster = r

            home_lineup = _parse_lineup(home_roster) if home_roster else None
            away_lineup = _parse_lineup(away_roster) if away_roster else None

            # Only return lineups if we have starters
            if home_lineup and not home_lineup["players"]:
                home_lineup = None
            if away_lineup and not away_lineup["players"]:
                away_lineup = None

            return {"home": home_lineup, "away": away_lineup}

    except Exception:
        logger.exception(
            "ESPN lineup fetch failed",
            extra={"home_team": home_team, "away_team": away_team, "match_date": match_date},
        )
        return {"home": None, "away": None}
