from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class RatingBase(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    review: Optional[str] = None

class RatingCreate(RatingBase):
    album_id: int

class Rating(RatingBase):
    id: int
    album_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
