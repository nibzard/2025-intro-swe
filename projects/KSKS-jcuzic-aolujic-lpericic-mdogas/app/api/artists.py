from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.artist import Artist, ArtistCreate
from app.schemas.album import Album
from app.crud import artist as crud_artist

router = APIRouter(prefix="/artists", tags=["Artists"])

@router.get("/", response_model=List[Artist])
def get_artists(
    skip: int = 0,
    limit: int = 50,
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Dohvati sve izvođače"""
    artists = crud_artist.get_artists(db, skip=skip, limit=limit, region=region)
    return artists

@router.get("/{artist_id}", response_model=Artist)
def get_artist(artist_id: int, db: Session = Depends(get_db)):
    """Detalji izvođača"""
    artist = crud_artist.get_artist(db, artist_id=artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Izvođač nije pronađen")
    return artist

@router.get("/{artist_id}/albums", response_model=List[Album])
def get_artist_albums(artist_id: int, db: Session = Depends(get_db)):
    """Diskografija izvođača"""
    artist = crud_artist.get_artist(db, artist_id=artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Izvođač nije pronađen")
    
    albums = crud_artist.get_artist_albums(db, artist_id=artist_id)
    return albums

@router.post("/", response_model=Artist)
def create_artist(artist: ArtistCreate, db: Session = Depends(get_db)):
    """Kreiraj novog izvođača"""
    # Provjeri da li već postoji
    existing = crud_artist.get_artist_by_name(db, name=artist.name)
    if existing:
        raise HTTPException(status_code=400, detail="Izvođač već postoji")
    
    return crud_artist.create_artist(db=db, artist=artist)


@router.post("/{artist_id}/enrich-wikipedia", response_model=Artist)
def enrich_artist_wikipedia(artist_id: int, db: Session = Depends(get_db)):
    """
    Fetch Wikipedia biography for an artist
    """
    from app.core.wikipedia_service import WikipediaService
    
    artist = crud_artist.get_artist(db, artist_id=artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    # Fetch Wikipedia bio
    wikipedia_bio = WikipediaService.get_artist_bio(
        artist_name=artist.name,
        genre=artist.genre,
        max_sentences=15
    )
    
    if wikipedia_bio:
        artist.wikipedia_bio = wikipedia_bio
        db.commit()
        db.refresh(artist)
    
    return artist