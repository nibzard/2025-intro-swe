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
    from app.models.album import Album
    return db.query(Album).filter(Album.artist_id == artist_id).all()