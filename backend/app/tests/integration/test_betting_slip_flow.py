import pytest
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.betting_slip import BettingSlip
from app.services.betting_slip_service import get_slip, export_slip


def test_slip_seeded(db: Session):
    user = db.query(User).filter(User.email == "test@example.com").first()
    slip = db.query(BettingSlip).filter(BettingSlip.user_id == user.id).first()
    assert slip is not None
    assert slip.name == "Test Slip"


def test_get_slip(db: Session):
    user = db.query(User).filter(User.email == "test@example.com").first()
    slip = db.query(BettingSlip).filter(BettingSlip.user_id == user.id).first()
    result = get_slip(slip.id, db)
    assert result["slip"].id == slip.id
    assert result["total_potential_winnings"] >= 0


def test_export_slip(db: Session):
    user = db.query(User).filter(User.email == "test@example.com").first()
    slip = db.query(BettingSlip).filter(BettingSlip.user_id == user.id).first()
    result = export_slip(slip.id, db)
    assert result["slip"].exported_at is not None
    assert len(result["slip"].items) >= 0
