"""Service layer for managing betting slips: creation, item addition, retrieval, and export."""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.betting_slip import BettingSlip
from app.models.betting_slip_item import BettingSlipItem
from app.models.prediction import Prediction

logger = logging.getLogger(__name__)


def create_slip(user_id: int, name: str, db: Session) -> BettingSlip:
    """Create and persist a new named betting slip for a user."""
    slip = BettingSlip(user_id=user_id, name=name)
    db.add(slip)
    db.commit()
    db.refresh(slip)
    logger.info("Betting slip created", extra={"slip_id": slip.id, "user_id": user_id})
    return slip


def get_user_slips(user_id: int, db: Session) -> list:
    """Return all betting slips for a user, newest first."""
    return db.query(BettingSlip).filter(BettingSlip.user_id == user_id).order_by(BettingSlip.created_at.desc()).all()


def add_prediction_to_slip(slip_id: int, prediction_id: int, stake: float, db: Session) -> BettingSlipItem:
    """Add a prediction to a slip with a calculated stake and potential winnings, raising 404 if either is missing."""
    slip = db.query(BettingSlip).filter(BettingSlip.id == slip_id).first()
    if not slip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slip not found")

    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")

    odds = round(1.0 + (1.0 - float(prediction.confidence)) * 3.0, 2)
    potential_winnings = round(stake * odds, 2)

    item = BettingSlipItem(
        slip_id=slip_id,
        prediction_id=prediction_id,
        odds=odds,
        stake=stake,
        potential_winnings=potential_winnings,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    logger.info(
        "Prediction added to betting slip",
        extra={"slip_id": slip_id, "prediction_id": prediction_id, "stake": stake},
    )
    return item


def get_slip(slip_id: int, db: Session) -> dict:
    """Return a slip with its items and total potential winnings, raising 404 if not found."""
    slip = db.query(BettingSlip).filter(BettingSlip.id == slip_id).first()
    if not slip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slip not found")
    total = sum(item.potential_winnings for item in slip.items)
    return {"slip": slip, "total_potential_winnings": total}


def export_slip(slip_id: int, db: Session) -> dict:
    """Mark a slip as exported (stamps exported_at) and return it with totals."""
    result = get_slip(slip_id, db)
    slip = result["slip"]
    slip.exported_at = datetime.utcnow()
    db.commit()
    db.refresh(slip)
    return {"slip": slip, "total_potential_winnings": result["total_potential_winnings"]}
