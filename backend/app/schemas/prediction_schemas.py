from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


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
    actual_home_score: int | None = None
    actual_away_score: int | None = None
    result: str = "pending"
    home_injuries: Optional[list[str]] = []
    away_injuries: Optional[list[str]] = []

    @field_validator("home_injuries", "away_injuries", mode="before")
    @classmethod
    def coerce_none_to_list(cls, v):
        return v if v is not None else []
