from pydantic import BaseModel
from typing import Optional
from app.schemas.artist import Artist
from app.schemas.producer import Producer

class AlbumBase(BaseModel):
    title: str
    artist_id: int  # ✨ PROMJENA
    year: int
    region: str
    producer_id: Optional[int] = None  # ✨ PROMJENA
    label: Optional[str] = None
    cover_url: Optional[str] = None
    story: Optional[str] = None  # ✨ NOVO
    impact: Optional[str] = None  # ✨ NOVO
    trivia: Optional[str] = None  # ✨ NOVO

class AlbumCreate(AlbumBase):
    pass

class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    artist_id: Optional[int] = None
    year: Optional[int] = None
    region: Optional[str] = None
    producer_id: Optional[int] = None
    label: Optional[str] = None
    cover_url: Optional[str] = None
    story: Optional[str] = None
    impact: Optional[str] = None
    trivia: Optional[str] = None

class Album(AlbumBase):
    id: int
    avg_rating: float
    total_ratings: int
    artist: Optional[Artist] = None  # ✨ NOVO - relationship
    producer: Optional[Producer] = None  # ✨ NOVO - relationship

    class Config:
        from_attributes = True