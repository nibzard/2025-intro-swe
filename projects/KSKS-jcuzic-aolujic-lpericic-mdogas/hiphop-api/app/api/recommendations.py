from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.album import Album
from app.core.recommendation import RecommendationEngine
from pydantic import BaseModel

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

class AlbumRecommendation(BaseModel):
    album: Album
    similarity_score: float
    reason: str
    
    class Config:
        from_attributes = True

@router.get("/similar/{album_id}", response_model=List[AlbumRecommendation])
def get_similar_albums(
    album_id: int,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Preporuči albume slične odabranom albumu
    """
    recommendations = RecommendationEngine.get_similar_albums(
        db, album_id=album_id, limit=limit
    )
    
    if not recommendations:
        raise HTTPException(status_code=404, detail="Album not found")
    
    return recommendations

@router.get("/top-rated", response_model=List[Album])
def get_top_rated(
    limit: int = Query(10, ge=1, le=50),
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Najbolje ocijenjeni albumi
    Region: east_coast, west_coast, south, midwest
    """
    albums = RecommendationEngine.get_top_rated(db, limit=limit, region=region)
    return albums

@router.get("/random", response_model=Album)
def get_random_classic(
    region: Optional[str] = Query(None, description="east_coast, west_coast, south, midwest"),
    era: Optional[str] = Query(None, description="golden_age (1988-1997), late_90s (1998-2000)"),
    db: Session = Depends(get_db)
):
    """
    Nasumični klasični album za otkrivanje
    """
    album = RecommendationEngine.get_random_classic(db, region=region, era=era)
    
    if not album:
        raise HTTPException(status_code=404, detail="No albums found matching criteria")
    
    return album

@router.get("/artist/{artist_name}", response_model=List[Album])
def get_artist_albums(
    artist_name: str,
    db: Session = Depends(get_db)
):
    """
    Svi albumi od određenog izvođača
    """
    albums = RecommendationEngine.get_artist_discography(db, artist=artist_name)
    
    if not albums:
        raise HTTPException(status_code=404, detail=f"No albums found for artist: {artist_name}")
    
    return albums
