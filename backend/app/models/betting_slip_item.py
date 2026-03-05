from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class BettingSlipItem(Base):
    __tablename__ = "betting_slip_items"

    id = Column(Integer, primary_key=True, index=True)
    slip_id = Column(Integer, ForeignKey("betting_slips.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    odds = Column(Float, nullable=False)
    potential_winnings = Column(Float, nullable=False)
    stake = Column(Float, nullable=False)

    slip = relationship("BettingSlip", back_populates="items")
    prediction = relationship("Prediction", backref="slip_items")
