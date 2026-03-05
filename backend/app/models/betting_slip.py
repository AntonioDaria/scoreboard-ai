from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class BettingSlip(Base):
    __tablename__ = "betting_slips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    exported_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="betting_slips")
    items = relationship("BettingSlipItem", back_populates="slip", cascade="all, delete-orphan")
