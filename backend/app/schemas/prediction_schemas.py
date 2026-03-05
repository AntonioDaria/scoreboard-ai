from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PredictionCreate(BaseModel):
    fixture_id: int


class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    fixture_id: int
    home_team: str
    away_team: str
    league: str | None = None
    predicted_home_score: int
    predicted_away_score: int
    confidence: float
    reasoning: str
    suggested_bet: str
    created_at: datetime
