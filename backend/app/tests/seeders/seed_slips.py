from app.models.betting_slip import BettingSlip
from app.models.betting_slip_item import BettingSlipItem
from app.models.user import User
from app.models.prediction import Prediction


def seed_slips(db):
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        return []

    prediction = db.query(Prediction).filter(Prediction.user_id == user.id).first()
    if not prediction:
        return []

    slip = BettingSlip(user_id=user.id, name="Test Slip")
    db.add(slip)
    db.commit()
    db.refresh(slip)

    item = BettingSlipItem(
        slip_id=slip.id,
        prediction_id=prediction.id,
        odds=1.85,
        stake=10.0,
        potential_winnings=18.5,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return [slip]
