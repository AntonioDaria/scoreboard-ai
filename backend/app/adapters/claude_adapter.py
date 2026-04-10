import logging
import os
import re
import json
import random
import anthropic
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


def _form_score(matches_data: dict, team_id: int) -> float:
    matches = matches_data.get("matches", [])
    if not matches:
        return 0.5
    points = 0
    for m in matches:
        winner = (m.get("score") or {}).get("winner")
        is_home = (m.get("homeTeam") or {}).get("id") == team_id
        if winner == "DRAW":
            points += 1
        elif (winner == "HOME_TEAM" and is_home) or (winner == "AWAY_TEAM" and not is_home):
            points += 3
    return points / (len(matches) * 3)


def _statistical_prediction(match_context: dict) -> dict:
    home_team = match_context.get("home_team", "Home")
    away_team = match_context.get("away_team", "Away")
    home_rank = match_context.get("home_league_rank", "N/A")
    away_rank = match_context.get("away_league_rank", "N/A")
    home_id = match_context.get("home_team_id")
    away_id = match_context.get("away_team_id")

    MAX_TEAMS = 20

    def rank_strength(rank):
        try:
            return (MAX_TEAMS - int(rank)) / MAX_TEAMS
        except (TypeError, ValueError):
            return 0.5

    home_rank_str = rank_strength(home_rank)
    away_rank_str = rank_strength(away_rank)

    home_form = _form_score(match_context.get("home_recent_matches", {}), home_id) if home_id else 0.5
    away_form = _form_score(match_context.get("away_recent_matches", {}), away_id) if away_id else 0.5

    home_str = 0.5 * home_rank_str + 0.5 * home_form + 0.08  # home advantage
    away_str = 0.5 * away_rank_str + 0.5 * away_form

    total = home_str + away_str
    home_prob = home_str / total
    away_prob = away_str / total

    home_goals = max(0, round(1.3 * (0.4 + home_prob) + random.uniform(-0.4, 0.4)))
    away_goals = max(0, round(1.3 * (0.4 + away_prob) + random.uniform(-0.4, 0.4)))

    if home_goals > away_goals:
        suggested_bet = "Home Win"
    elif away_goals > home_goals:
        suggested_bet = "Away Win"
    else:
        suggested_bet = "Draw"

    rank_text = ""
    if home_rank != "N/A" and away_rank != "N/A":
        rank_text = f"{home_team} sit #{home_rank} and {away_team} #{away_rank} in the league. "
    elif home_rank != "N/A":
        rank_text = f"{home_team} sit #{home_rank} in the league. "
    elif away_rank != "N/A":
        rank_text = f"{away_team} sit #{away_rank} in the league. "

    reasoning = (
        f"⚠️ This prediction was generated using a statistical model based on league standings and recent form — "
        f"AI-powered analysis is temporarily unavailable. {rank_text}"
        f"{home_team} have a {round(home_prob * 100)}% estimated win probability vs "
        f"{round(away_prob * 100)}% for {away_team} (including home advantage). "
        f"Results may be less accurate than our usual AI analysis."
    )

    return {
        "predicted_home_score": home_goals,
        "predicted_away_score": away_goals,
        "confidence": round(0.35 + abs(home_prob - away_prob) * 0.25, 2),
        "reasoning": reasoning,
        "suggested_bet": suggested_bet,
    }


def _extract_json(text: str) -> dict:
    raw = text.strip()
    # Strip markdown fences
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            candidate = part.lstrip("json").strip()
            if candidate.startswith("{"):
                raw = candidate
                break
    # Find the JSON object even if there's narrative text around it
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end > start:
        raw = raw[start:end]
    result = json.loads(raw)
    result.setdefault("home_injuries", [])
    result.setdefault("away_injuries", [])
    return result


_TM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _transfermarkt_injuries(team_name: str) -> list[str]:
    """Scrape current injury/suspension list from Transfermarkt for a team."""
    try:
        with httpx.Client(follow_redirects=True, timeout=10, headers=_TM_HEADERS) as c:
            # Step 1: search for the team to get their slug + id
            search = c.get(
                "https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche",
                params={"query": team_name, "Kat": "Mannschaft"},
            )
            match = re.search(r'href="/([^/"]+)/startseite/verein/(\d+)"', search.text)
            if not match:
                logger.warning("Transfermarkt team not found in search", extra={"team": team_name})
                return []
            slug, team_id = match.group(1), match.group(2)

            # Step 2: fetch their injury/suspension page
            injury_page = c.get(
                f"https://www.transfermarkt.com/{slug}/sperrenundverletzungen/verein/{team_id}",
            )

        # Step 3: extract player name + injury reason
        # Names are in profile links; reasons in td class "links hauptlink img-vat"
        names = re.findall(
            r'href="/[^/]+/profil/spieler/\d+"[^>]*>([^<]+)</a>',
            injury_page.text,
        )
        reasons = re.findall(
            r'<td class="links hauptlink img-vat">([^<]+)</td>',
            injury_page.text,
        )
        results = []
        for name, reason in zip(names, reasons):
            name = name.strip()
            reason = reason.strip()
            if name and reason:
                results.append(f"{name} — {reason}")
        return results[:10]
    except Exception:
        logger.exception("Transfermarkt injury scrape failed", extra={"team": team_name})
        return []


def _fetch_injury_news(home_team: str, away_team: str) -> str:
    """Fetch current injury/suspension data from Transfermarkt for both teams."""
    home_injuries = _transfermarkt_injuries(home_team)
    away_injuries = _transfermarkt_injuries(away_team)
    parts = []
    if home_injuries:
        parts.append(f"{home_team} injuries/suspensions:\n" + "\n".join(home_injuries))
    else:
        parts.append(f"{home_team} injuries/suspensions: none reported")
    if away_injuries:
        parts.append(f"{away_team} injuries/suspensions:\n" + "\n".join(away_injuries))
    else:
        parts.append(f"{away_team} injuries/suspensions: none reported")
    return "\n\n".join(parts)


def generate_prediction(match_context: dict) -> dict:
    home_team = match_context['home_team']
    away_team = match_context['away_team']

    logger.info(
        "Generating prediction",
        extra={"fixture_id": match_context['fixture_id'], "home_team": home_team, "away_team": away_team},
    )

    injury_news = _fetch_injury_news(home_team, away_team)

    prompt = f"""You are an expert football analyst. Analyse the following match data and provide a prediction.

Match: {home_team} vs {away_team}
Fixture ID: {match_context['fixture_id']}

Home team recent form: {json.dumps(match_context.get('home_recent_matches', {}), separators=(',', ':'))}
Away team recent form: {json.dumps(match_context.get('away_recent_matches', {}), separators=(',', ':'))}
Head to head history: {json.dumps(match_context.get('head_to_head', {}), separators=(',', ':'))}
Home league rank: {match_context.get('home_league_rank', 'N/A')}
Away league rank: {match_context.get('away_league_rank', 'N/A')}

Latest injury & suspension news:
{injury_news if injury_news else "No injury information available."}

Respond ONLY with a valid JSON object in exactly this format with no other text:
{{
  "predicted_home_score": <integer>,
  "predicted_away_score": <integer>,
  "confidence": <float between 0 and 1>,
  "reasoning": "<A detailed 3-5 sentence explanation covering: (1) each team's recent form and key trends, (2) how their league positions and head-to-head record influences the prediction, (3) any injury/suspension concerns that affect the prediction, and (4) why you chose this specific scoreline and bet. Write it as a knowledgeable analyst talking directly to a bettor.>",
  "suggested_bet": "<e.g. Home Win, Draw, Away Win, Both Teams to Score, Over 2.5 Goals>",
  "home_injuries": ["<player name — reason>", ...],
  "away_injuries": ["<player name — reason>", ...]
}}

Use empty arrays for home_injuries/away_injuries if none found."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        for block in response.content:
            text = getattr(block, "text", None)
            if getattr(block, "type", None) == "text" and text and text.strip():
                return _extract_json(text)
    except Exception:
        logger.exception("Claude API call failed", extra={"fixture_id": match_context['fixture_id']})

    logger.warning(
        "Falling back to statistical prediction",
        extra={"fixture_id": match_context['fixture_id']},
    )
    result = _statistical_prediction(match_context)
    result["home_injuries"] = []
    result["away_injuries"] = []
    return result
