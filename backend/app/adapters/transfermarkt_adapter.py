"""HTML scraping adapter for Transfermarkt, used to fetch team lineups and injury/suspension data."""
import logging
import re
import httpx

logger = logging.getLogger(__name__)

_TM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _search_team(client: httpx.Client, team_name: str) -> tuple[str, str] | None:
    """Search Transfermarkt for a team and return its (slug, id) pair, or None if not found."""
    search = client.get(
        "https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche",
        params={"query": team_name, "Kat": "Mannschaft"},
    )
    m = re.search(r'href="/([^/"]+)/startseite/verein/(\d+)"', search.text)
    if not m:
        return None
    return m.group(1), m.group(2)


def _assign_positions(formation: str, players: list[dict]) -> list[dict]:
    """Assign GK/DEF/MID/FWD positions based on formation order."""
    try:
        groups = [int(x) for x in formation.split("-")]
    except (ValueError, AttributeError):
        groups = [4, 4, 2]

    # Build per-group labels: first group → DEF, middle → MID, last → FWD
    num_groups = len(groups)
    group_positions = []
    for i, count in enumerate(groups):
        if i == num_groups - 1:
            group_positions.extend(["FWD"] * count)
        elif i == 0:
            group_positions.extend(["DEF"] * count)
        else:
            group_positions.extend(["MID"] * count)

    # First player is always GK
    result = []
    if players:
        result.append({**players[0], "position": "GK"})
    for i, player in enumerate(players[1:]):
        pos = group_positions[i] if i < len(group_positions) else "MID"
        result.append({**player, "position": pos})
    return result


def get_lineup(team_name: str) -> dict:
    """Scrape the current/last lineup from Transfermarkt for a team.

    Returns:
        {"formation": "4-3-3", "players": [{"name": ..., "number": ..., "position": ...}, ...]}
        or {} if scraping fails.
    """
    try:
        with httpx.Client(follow_redirects=True, timeout=10, headers=_TM_HEADERS) as c:
            result = _search_team(c, team_name)
            if not result:
                logger.warning("Transfermarkt team not found in search", extra={"team": team_name})
                return {}
            slug, team_id = result

            page = c.get(
                f"https://www.transfermarkt.com/{slug}/aufstellung/verein/{team_id}",
            )

        html = page.text

        # Extract formation: look for patterns like "4-3-3", "4-2-3-1", "3-5-2"
        fm = re.search(r"\b(\d-\d-\d(?:-\d)?)\b", html)
        formation = fm.group(1) if fm else "4-4-2"

        # Extract shirt numbers from the pitch layout
        numbers = re.findall(r'<div[^>]*class="[^"]*rn_nummer[^"]*"[^>]*>\s*(\d+)\s*</div>', html)

        # Extract player names — TM uses spielprofil_tooltip class on player links
        names = re.findall(
            r'<a[^>]+href="/[^/]+/profil/spieler/\d+"[^>]+>([^<]+)</a>',
            html,
        )

        # De-duplicate names (TM sometimes repeats links)
        seen_names: set[str] = set()
        unique_names: list[str] = []
        for n in names:
            clean = n.strip()
            if clean and clean not in seen_names:
                seen_names.add(clean)
                unique_names.append(clean)

        # Pair numbers with names (both lists should be 11 long)
        players_raw = []
        for i, (num, name) in enumerate(zip(numbers[:11], unique_names[:11])):
            try:
                players_raw.append({"number": int(num), "name": name})
            except ValueError:
                players_raw.append({"number": i + 1, "name": name})

        players = _assign_positions(formation, players_raw)

        if not players:
            return {}

        return {"formation": formation, "players": players}

    except Exception:
        logger.exception("Transfermarkt lineup scrape failed", extra={"team": team_name})
        return {}
