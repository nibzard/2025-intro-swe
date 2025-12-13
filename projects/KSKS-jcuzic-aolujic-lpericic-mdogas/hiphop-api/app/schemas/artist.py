from pydantic import BaseModel
from typing import Optional

class ArtistBase(BaseModel):
    name: str
    region: str
    era: Optional[str] = None
    image_url: Optional[str] = None
    biography: Optional[str] = None
    fun_facts: Optional[str] = None
    influence_score: Optional[float] = 0.0

class ArtistCreate(ArtistBase):
    pass

class Artist(ArtistBase):
    id: int

    class Config:
        from_attributes = True