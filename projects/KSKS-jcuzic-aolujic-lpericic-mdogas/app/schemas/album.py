from pydantic import BaseModel
from typing import Optional

class AlbumBase(BaseModel):
    title: str
    artist: str
    year: int
    genre: str
    region: Optional[str] = None
    producer: Optional[str] = None
    label: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None

class AlbumCreate(AlbumBase):
    pass

class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    region: Optional[str] = None
    producer: Optional[str] = None
    label: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    artist_bio: Optional[str] = None
    album_story: Optional[str] = None
    producer_bio: Optional[str] = None

class Album(AlbumBase):
    id: int
    avg_rating: float
    total_ratings: int
    artist_bio: Optional[str] = None
    album_story: Optional[str] = None
    producer_bio: Optional[str] = None

    class Config:
        from_attributes = True
