from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.album import Album, AlbumCreate, AlbumUpdate
from app.crud import album as crud_album

router = APIRouter(prefix="/albums", tags=["Albums"])  # BEZ /

@router.get("/", response_model=List[Album])
def get_albums(
    skip: int = 0,
    limit: int = 20,
    artist: Optional[str] = None,
    year: Optional[int] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    albums = crud_album.get_albums(
        db, skip=skip, limit=limit, artist=artist, year=year, region=region
    )
    return albums

@router.get("/{album_id}", response_model=Album)
def get_album(album_id: int, db: Session = Depends(get_db)):
    album = crud_album.get_album(db, album_id=album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.post("/", response_model=Album, status_code=status.HTTP_201_CREATED)
def create_album(album: AlbumCreate, db: Session = Depends(get_db)):
    return crud_album.create_album(db=db, album=album)

@router.put("/{album_id}", response_model=Album)
def update_album(album_id: int, album: AlbumUpdate, db: Session = Depends(get_db)):
    updated_album = crud_album.update_album(db, album_id=album_id, album_update=album)
    if not updated_album:
        raise HTTPException(status_code=404, detail="Album not found")
    return updated_album

@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(album_id: int, db: Session = Depends(get_db)):
    success = crud_album.delete_album(db, album_id=album_id)
    if not success:
        raise HTTPException(status_code=404, detail="Album not found")
    return None
