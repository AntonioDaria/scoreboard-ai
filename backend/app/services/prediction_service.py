"""Service layer for AI match predictions: enforces daily limits, assembles match context, and persists results."""
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.adapters.football_data_adapter import get_match, get_match_h2h, get_standings, get_team_matches
from app.adapters.claude_adapter import generate_prediction
from app.models.prediction import Prediction

logger = logging.getLogger(__name__)

DAILY_LIMIT = 5


def create_prediction(user_id: int, fixture_id: int, db: Session) -> Prediction:
    """Enforce daily limit, gather match context, call the AI adapter, and persist the resulting prediction."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count_today = (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id, Prediction.created_at >= today_start)
        .count()
    )
    if count_today >= DAILY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit of {DAILY_LIMIT} predictions reached. Come back tomorrow!",
        )
    match_data = get_match(fixture_id)
    if not match_data or "id" not in match_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fixture not found")

    home_team_id = match_data["homeTeam"]["id"]
    away_team_id = match_data["awayTeam"]["id"]
    home_team = match_data["homeTeam"]["name"]
    away_team = match_data["awayTeam"]["name"]
    competition_code = match_data["competition"]["code"]
    league = match_data["competition"]["name"]

    h2h_data = {}
    home_form_data = {}
    away_form_data = {}
    home_rank = "N/A"
    away_rank = "N/A"

    try:
        h2h_data = get_match_h2h(fixture_id)
    except Exception:
        logger.warning("Failed to fetch h2h data", extra={"fixture_id": fixture_id})

    try:
        standings_data = get_standings(competition_code)
        table = standings_data["standings"][0]["table"]
        home_rank = next((t["position"] for t in table if t["team"]["id"] == home_team_id), "N/A")
        away_rank = next((t["position"] for t in table if t["team"]["id"] == away_team_id), "N/A")
    except Exception:
        logger.warning("Failed to fetch standings", extra={"competition_code": competition_code})

    try:
        home_form_data = get_team_matches(home_team_id, limit=5)
    except Exception:
        logger.warning("Failed to fetch home team form", extra={"team_id": home_team_id})

    try:
        away_form_data = get_team_matches(away_team_id, limit=5)
    except Exception:
        logger.warning("Failed to fetch away team form", extra={"team_id": away_team_id})

    match_context = {
        "fixture_id": fixture_id,
        "competition": league,
        "home_team": home_team,
        "away_team": away_team,
        "home_team_id": home_team_id,
        "away_team_id": away_team_id,
        "match_date": match_data.get("utcDate", ""),
        "home_league_rank": home_rank,
        "away_league_rank": away_rank,
        "head_to_head": h2h_data,
        "home_recent_matches": home_form_data,
        "away_recent_matches": away_form_data,
    }

    ai_result = generate_prediction(match_context)

    prediction = Prediction(
        user_id=user_id,
        fixture_id=fixture_id,
        home_team=home_team,
        away_team=away_team,
        league=league,
        predicted_home_score=ai_result["predicted_home_score"],
        predicted_away_score=ai_result["predicted_away_score"],
        confidence=ai_result["confidence"],
        reasoning=ai_result["reasoning"],
        suggested_bet=ai_result["suggested_bet"],
        home_injuries=ai_result.get("home_injuries", []),
        away_injuries=ai_result.get("away_injuries", []),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    logger.info(
        "Prediction created",
        extra={"prediction_id": prediction.id, "user_id": user_id, "fixture_id": fixture_id},
    )
    return prediction


def get_remaining_predictions(user_id: int, db: Session) -> dict:
    """Return how many predictions the user has used and how many remain for today."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count_today = (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id, Prediction.created_at >= today_start)
        .count()
    )
    return {"used": count_today, "limit": DAILY_LIMIT, "remaining": max(0, DAILY_LIMIT - count_today)}


def get_user_predictions(user_id: int, db: Session) -> list:
    """Return all predictions belonging to the given user."""
    return db.query(Prediction).filter(Prediction.user_id == user_id).all()


def get_prediction_by_id(prediction_id: int, db: Session) -> Prediction:
    """Return a single prediction by ID, raising 404 if it does not exist."""
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    return prediction
