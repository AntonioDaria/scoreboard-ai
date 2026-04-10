import logging
import threading

from fastapi import APIRouter, Depends

logger = logging.getLogger(__name__)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.schemas.prediction_schemas import PredictionCreate, PredictionResponse
from app.services import prediction_service, auth_service, result_checker_service

router = APIRouter()
bearer = HTTPBearer()


def _current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    return auth_service.get_current_user(credentials.credentials, db)


@router.post("", response_model=PredictionResponse, status_code=201)
def create_prediction(body: PredictionCreate, user=Depends(_current_user), db: Session = Depends(get_db)):
    return prediction_service.create_prediction(user.id, body.fixture_id, db)


@router.get("/remaining")
def remaining_predictions(user=Depends(_current_user), db: Session = Depends(get_db)):
    return prediction_service.get_remaining_predictions(user.id, db)


def _check_results_background():
    """Run result checker in a background thread with its own DB session."""
    db = SessionLocal()
    try:
        result_checker_service.check_pending_predictions(db)
    except Exception:
        logger.exception("Result checker background thread failed")
    finally:
        db.close()


@router.get("", response_model=list[PredictionResponse])
def list_predictions(user=Depends(_current_user), db: Session = Depends(get_db)):
    threading.Thread(target=_check_results_background, daemon=True).start()
    return prediction_service.get_user_predictions(user.id, db)


@router.get("/{prediction_id}", response_model=PredictionResponse)
def get_prediction(prediction_id: int, user=Depends(_current_user), db: Session = Depends(get_db)):
    return prediction_service.get_prediction_by_id(prediction_id, db)
