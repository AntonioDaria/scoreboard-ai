from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class SlipCreate(BaseModel):
    name: str


class SlipItemCreate(BaseModel):
    prediction_id: int
    stake: float


class SlipCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    user_id: int
    created_at: datetime


class SlipItemPrediction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    home_team: str
    away_team: str
    predicted_home_score: int
    predicted_away_score: int
    suggested_bet: str


class SlipItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slip_id: int
    prediction_id: int
    odds: float
    potential_winnings: float
    stake: float
    prediction: Optional[SlipItemPrediction] = None


class SlipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    created_at: datetime
    exported_at: Optional[datetime]
    items: List[SlipItemResponse] = []
    total_potential_winnings: float = 0.0
