from sqlalchemy.orm import Session
from app.models.artist import Artist
from app.schemas.artist import ArtistCreate
from typing import Optional

def get_artist(db: Session, artist_id: int):
    return db.query(Artist).filter(Artist.id == artist_id).first()

def get_artist_by_name(db: Session, name: str):
    return db.query(Artist).filter(Artist.name == name).first()

def get_artists(db: Session, skip: int = 0, limit: int = 50, region: Optional[str] = None):
    query = db.query(Artist)
    
    if region:
        query = query.filter(Artist.region == region)
    
    return query.order_by(Artist.influence_score.desc()).offset(skip).limit(limit).all()

def create_artist(db: Session, artist: ArtistCreate):
    db_artist = Artist(**artist.dict())
    db.add(db_artist)
    db.commit()
    db.refresh(db_artist)
    return db_artist

def get_artist_albums(db: Session, artist_id: int):
    """Get all albums by an artist - matches by artist name"""
    from app.models.album import Album
    
    # First get the artist to get their name
    artist = db.query(Artist).filter(Artist.id == artist_id).first()
    
    if not artist:
        return []
    
    # Then find albums that match the artist's name
    return db.query(Album).filter(Album.artist == artist.name).all()