import logging
from sqlalchemy.orm import Session

from app.adapters.football_data_adapter import get_match
from app.models.prediction import Prediction

logger = logging.getLogger(__name__)

import re as _re


def _eval_part(part: str, total_goals: int, home_win: bool, away_win: bool, draw: bool,
               btts: bool, clean_sheet_home: bool, clean_sheet_away: bool) -> bool | None:
    """Evaluate a single bet part. Returns None if unrecognised (to be skipped)."""
    p = part.strip()

    if p == "Home Win":
        return home_win
    if p == "Away Win":
        return away_win
    if p == "Draw":
        return draw
    if p in ("Both Teams to Score", "BTTS"):
        return btts
    if p in ("Home Clean Sheet", "Clean Sheet"):
        return clean_sheet_home
    if p == "Away Clean Sheet":
        return clean_sheet_away

    # Generic "Over X.5 Goals" / "Under X.5 Goals"
    over_m = _re.match(r"Over\s+(\d+(?:\.\d+)?)\s*Goals?", p, _re.IGNORECASE)
    if over_m:
        threshold = float(over_m.group(1))
        return total_goals > threshold

    under_m = _re.match(r"Under\s+(\d+(?:\.\d+)?)\s*Goals?", p, _re.IGNORECASE)
    if under_m:
        threshold = float(under_m.group(1))
        return total_goals < threshold

    return None  # unrecognised


def _evaluate_bet(suggested_bet: str, actual_home: int, actual_away: int) -> bool:
    """Return True if the suggested bet was correct given the actual scoreline."""
    total_goals = actual_home + actual_away
    home_win = actual_home > actual_away
    away_win = actual_away > actual_home
    draw = actual_home == actual_away
    btts = actual_home > 0 and actual_away > 0
    clean_sheet_home = actual_away == 0
    clean_sheet_away = actual_home == 0

    # Split compound bets on " & " or " and "
    raw_parts = _re.split(r"\s*&\s*|\s+and\s+", suggested_bet.strip(), flags=_re.IGNORECASE)
    results = []
    for part in raw_parts:
        val = _eval_part(
            part, total_goals, home_win, away_win, draw,
            btts, clean_sheet_home, clean_sheet_away,
        )
        if val is not None:
            results.append(val)
        # Strip parenthetical team names e.g. "Away Win (Inter Milan)" → "Away Win"
        else:
            clean = _re.sub(r"\s*\(.*?\)", "", part).strip()
            val2 = _eval_part(
                clean, total_goals, home_win, away_win, draw,
                btts, clean_sheet_home, clean_sheet_away,
            )
            if val2 is not None:
                results.append(val2)
            # else: truly unknown part, skip

    return all(results) if results else False


def check_pending_predictions(db: Session) -> int:
    """
    Fetch all pending predictions, check if their match is finished,
    and update actual scores + result. Returns the number updated.
    """
    pending = db.query(Prediction).filter(Prediction.result == "pending").all()
    updated = 0

    for prediction in pending:
        try:
            match_data = get_match(prediction.fixture_id)
        except Exception:
            logger.exception(
                "Failed to fetch match data for result check",
                extra={"fixture_id": prediction.fixture_id, "prediction_id": prediction.id},
            )
            continue

        # football-data.org wraps the match under a "match" key for single match endpoint
        if "match" in match_data:
            match_data = match_data["match"]

        if match_data.get("status") != "FINISHED":
            continue

        score = match_data.get("score", {}).get("fullTime", {})
        actual_home = score.get("home")
        actual_away = score.get("away")

        if actual_home is None or actual_away is None:
            continue

        correct = _evaluate_bet(prediction.suggested_bet, actual_home, actual_away)
        prediction.actual_home_score = actual_home
        prediction.actual_away_score = actual_away
        prediction.result = "correct" if correct else "incorrect"
        updated += 1

    if updated:
        db.commit()
        logger.info("Prediction results updated", extra={"count": updated})

    return updated
