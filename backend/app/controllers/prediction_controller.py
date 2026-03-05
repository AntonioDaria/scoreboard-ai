from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.prediction_schemas import PredictionCreate, PredictionResponse
from app.services import prediction_service, auth_service

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


@router.get("", response_model=list[PredictionResponse])
def list_predictions(user=Depends(_current_user), db: Session = Depends(get_db)):
    return prediction_service.get_user_predictions(user.id, db)


@router.get("/{prediction_id}", response_model=PredictionResponse)
def get_prediction(prediction_id: int, user=Depends(_current_user), db: Session = Depends(get_db)):
    return prediction_service.get_prediction_by_id(prediction_id, db)
