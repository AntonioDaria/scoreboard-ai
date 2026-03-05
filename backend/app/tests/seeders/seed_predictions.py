from app.models.prediction import Prediction
from app.models.user import User


def seed_predictions(db):
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        return []

    predictions = [
        Prediction(
            user_id=user.id,
            fixture_id=1001,
            home_team="Arsenal",
            away_team="Chelsea",
            predicted_home_score=2,
            predicted_away_score=1,
            confidence=0.72,
            reasoning="Arsenal have strong home form and Chelsea are missing key players.",
            suggested_bet="Home Win",
        ),
        Prediction(
            user_id=user.id,
            fixture_id=1002,
            home_team="Liverpool",
            away_team="Manchester City",
            predicted_home_score=1,
            predicted_away_score=1,
            confidence=0.55,
            reasoning="Both sides are evenly matched. A draw is likely.",
            suggested_bet="Draw",
        ),
    ]
    db.add_all(predictions)
    db.commit()
    for p in predictions:
        db.refresh(p)
    return predictions
