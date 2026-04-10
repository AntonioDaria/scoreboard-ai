"""FastAPI router for betting slip endpoints: create slips, add predictions, view totals, and export."""
import logging
from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.db.database import get_db
from app.schemas.betting_slip_schemas import SlipCreate, SlipCreateResponse, SlipItemCreate, SlipItemResponse, SlipResponse
from app.services import betting_slip_service, auth_service

router = APIRouter()
bearer = HTTPBearer()


def _current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    """Dependency that extracts and validates the JWT bearer token, returning the authenticated user."""
    return auth_service.get_current_user(credentials.credentials, db)


@router.get("", response_model=list[SlipCreateResponse])
def list_slips(user=Depends(_current_user), db: Session = Depends(get_db)):
    """Return all betting slips for the authenticated user."""
    return betting_slip_service.get_user_slips(user.id, db)


@router.post("", response_model=SlipCreateResponse, status_code=201)
def create_slip(body: SlipCreate, user=Depends(_current_user), db: Session = Depends(get_db)):
    """Create a new named betting slip for the authenticated user."""
    slip = betting_slip_service.create_slip(user.id, body.name, db)
    return SlipCreateResponse.model_validate(slip)


@router.post("/{slip_id}/items", response_model=SlipItemResponse, status_code=201)
def add_item(slip_id: int, body: SlipItemCreate, user=Depends(_current_user), db: Session = Depends(get_db)):
    """Add a prediction to a betting slip with a stake amount."""
    item = betting_slip_service.add_prediction_to_slip(slip_id, body.prediction_id, body.stake, db)
    return SlipItemResponse.model_validate(item)


@router.get("/{slip_id}", response_model=SlipResponse)
def get_slip(slip_id: int, user=Depends(_current_user), db: Session = Depends(get_db)):
    """Return a betting slip with all its items and total potential winnings."""
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
    """Mark a betting slip as exported and return it with totals."""
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
