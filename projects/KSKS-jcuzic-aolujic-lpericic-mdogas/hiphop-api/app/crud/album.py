from sqlalchemy.orm import Session, joinedload
from app.models.album import Album
from app.models.artist import Artist
from app.schemas.album import AlbumCreate, AlbumUpdate
from typing import Optional

def get_album(db: Session, album_id: int):
    return db.query(Album).options(
        joinedload(Album.artist),
        joinedload(Album.producer)
    ).filter(Album.id == album_id).first()

def get_albums(db: Session, skip: int = 0, limit: int = 20, 
               artist: Optional[str] = None, 
               year: Optional[int] = None,
               region: Optional[str] = None):
    query = db.query(Album).options(
        joinedload(Album.artist),
        joinedload(Album.producer)
    )
    
    if artist:
        query = query.join(Album.artist).filter(Artist.name.ilike(f"%{artist}%"))
    if year:
        query = query.filter(Album.year == year)
    if region:
        query = query.filter(Album.region == region)
    
    return query.offset(skip).limit(limit).all()

def create_album(db: Session, album: AlbumCreate):
    db_album = Album(**album.dict())
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    return db_album

def update_album(db: Session, album_id: int, album_update: AlbumUpdate):
    db_album = db.query(Album).filter(Album.id == album_id).first()
    if not db_album:
        return None
    
    update_data = album_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_album, key, value)
    
    db.commit()
    db.refresh(db_album)
    return db_album

def delete_album(db: Session, album_id: int):
    db_album = db.query(Album).filter(Album.id == album_id).first()
    if db_album:
        db.delete(db_album)
        db.commit()
        return True
    return False