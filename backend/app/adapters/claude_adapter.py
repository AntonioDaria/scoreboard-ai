import os
import json
import random
import anthropic
from dotenv import load_dotenv

load_dotenv()

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


def generate_prediction(match_context: dict) -> dict:
    prompt = f"""You are an expert football analyst. Analyse the following match data and provide a prediction.

Match: {match_context['home_team']} vs {match_context['away_team']}
Fixture ID: {match_context['fixture_id']}

Home team recent form: {json.dumps(match_context.get('home_recent_matches', {}), indent=2)}
Away team recent form: {json.dumps(match_context.get('away_recent_matches', {}), indent=2)}
Head to head history: {json.dumps(match_context.get('head_to_head', {}), indent=2)}
Home league rank: {match_context.get('home_league_rank', 'N/A')}
Away league rank: {match_context.get('away_league_rank', 'N/A')}

Respond ONLY with a valid JSON object in exactly this format:
{{
  "predicted_home_score": <integer>,
  "predicted_away_score": <integer>,
  "confidence": <float between 0 and 1>,
  "reasoning": "<concise reasoning summary>",
  "suggested_bet": "<e.g. Home Win, Draw, Away Win, Both Teams to Score, Over 2.5 Goals>"
}}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        return json.loads(raw)
    except Exception:
        return _statistical_prediction(match_context)
