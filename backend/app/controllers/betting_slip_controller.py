from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.betting_slip_schemas import SlipCreate, SlipCreateResponse, SlipItemCreate, SlipItemResponse, SlipResponse
from app.services import betting_slip_service, auth_service

router = APIRouter()
bearer = HTTPBearer()


def _current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    return auth_service.get_current_user(credentials.credentials, db)


@router.get("", response_model=list[SlipCreateResponse])
def list_slips(user=Depends(_current_user), db: Session = Depends(get_db)):
    return betting_slip_service.get_user_slips(user.id, db)


@router.post("", response_model=SlipCreateResponse, status_code=201)
def create_slip(body: SlipCreate, user=Depends(_current_user), db: Session = Depends(get_db)):
    slip = betting_slip_service.create_slip(user.id, body.name, db)
    return SlipCreateResponse.model_validate(slip)


@router.post("/{slip_id}/items", response_model=SlipItemResponse, status_code=201)
def add_item(slip_id: int, body: SlipItemCreate, user=Depends(_current_user), db: Session = Depends(get_db)):
    item = betting_slip_service.add_prediction_to_slip(slip_id, body.prediction_id, body.stake, db)
    return SlipItemResponse.model_validate(item)


@router.get("/{slip_id}", response_model=SlipResponse)
def get_slip(slip_id: int, user=Depends(_current_user), db: Session = Depends(get_db)):
    result = betting_slip_service.get_slip(slip_id, db)
    slip = result["slip"]
    return SlipResponse(
        id=slip.id,
        user_id=slip.user_id,
        name=slip.name,
        created_at=slip.created_at,
        exported_at=slip.exported_at,
        items=slip.items,
        total_potential_winnings=result["total_potential_winnings"],
    )


@router.get("/{slip_id}/export", response_model=SlipResponse)
def export_slip(slip_id: int, user=Depends(_current_user), db: Session = Depends(get_db)):
    result = betting_slip_service.export_slip(slip_id, db)
    slip = result["slip"]
    return SlipResponse(
        id=slip.id,
        user_id=slip.user_id,
        name=slip.name,
        created_at=slip.created_at,
        exported_at=slip.exported_at,
        items=slip.items,
        total_potential_winnings=result["total_potential_winnings"],
    )
