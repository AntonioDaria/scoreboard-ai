import pytest
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.prediction import Prediction
from app.services.prediction_service import get_user_predictions, get_prediction_by_id


def test_prediction_seeded(db: Session):
    user = db.query(User).filter(User.email == "test@example.com").first()
    assert user is not None

    predictions = get_user_predictions(user.id, db)
    assert len(predictions) >= 1
    assert predictions[0].home_team is not None


def test_get_prediction_by_id(db: Session):
    user = db.query(User).filter(User.email == "test@example.com").first()
    predictions = get_user_predictions(user.id, db)
    assert len(predictions) > 0

    prediction = get_prediction_by_id(predictions[0].id, db)
    assert prediction.fixture_id is not None
