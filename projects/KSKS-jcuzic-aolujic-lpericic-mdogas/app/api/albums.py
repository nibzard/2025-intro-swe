from fastapi import (
    APIRouter, Depends, HTTPException, status, BackgroundTasks
)
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.album import Album, AlbumCreate, AlbumUpdate
from app.crud import album as crud_album
from app.core.wikipedia_service import WikipediaService
from app.core.auto_seed import fetch_albums_for_genre, AUTO_FETCH_ALBUMS

router = APIRouter(prefix="/albums", tags=["Albums"])


@router.get("/", response_model=List[Album])
def get_albums(
    skip: int = 0,
    limit: int = 20,
    genre: Optional[str] = None,
    artist: Optional[str] = None,
    year: Optional[int] = None,
    region: Optional[str] = None,
    random: bool = False,
    db: Session = Depends(get_db)
):
    albums = crud_album.get_albums(
        db, skip=skip, limit=limit, genre=genre,
        artist=artist, year=year, region=region,
        random_order=random
    )
    return albums


@router.get("/available-genres")
def get_available_genres():
    """
    Get list of available genres that can be auto-fetched from Spotify
    """
    return {
        "genres": list(AUTO_FETCH_ALBUMS.keys()),
        "albums_per_genre": {
            genre: len(albums) for genre, albums in AUTO_FETCH_ALBUMS.items()
        }
    }


@router.post("/fetch-from-spotify")
def fetch_albums_from_spotify(
    genre: Optional[str] = None,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """
    Fetch albums from Spotify and add them to the database

    Args:
        genre: Genre to fetch (hip_hop, jazz, classic_rock, prog_rock). If not provided, fetches all genres
        limit: Number of albums to fetch per genre (default: 5)

    Returns:
        Message with number of albums added
    """
    if genre:
        # Fetch specific genre
        if genre not in AUTO_FETCH_ALBUMS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid genre. Available genres: {', '.join(AUTO_FETCH_ALBUMS.keys())}"
            )

        added_count = fetch_albums_for_genre(genre, limit)
        return {
            "message": f"Successfully fetched {added_count} {genre} albums from Spotify",
            "genre": genre,
            "albums_added": added_count
        }
    else:
        # Fetch all genres
        total_added = 0
        results = {}

        for genre_name in AUTO_FETCH_ALBUMS.keys():
            added = fetch_albums_for_genre(genre_name, limit)
            results[genre_name] = added
            total_added += added

        return {
            "message": f"Successfully fetched {total_added} albums from Spotify across all genres",
            "albums_added": total_added,
            "by_genre": results
        }


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
def update_album(
    album_id: int,
    album: AlbumUpdate,
    db: Session = Depends(get_db)
):
    updated_album = crud_album.update_album(
        db, album_id=album_id, album_update=album
    )
    if not updated_album:
        raise HTTPException(status_code=404, detail="Album not found")
    return updated_album


@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(album_id: int, db: Session = Depends(get_db)):
    success = crud_album.delete_album(db, album_id=album_id)
    if not success:
        raise HTTPException(status_code=404, detail="Album not found")
    return None


@router.post("/{album_id}/enrich-wikipedia", response_model=Album)
def enrich_album_with_wikipedia(album_id: int, db: Session = Depends(get_db)):
    """
    Fetch Wikipedia data for an album and update the database
    This endpoint fetches artist bio, album story, and producer bio from Wikipedia
    """
    album = crud_album.get_album(db, album_id=album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    # Fetch Wikipedia data
    wiki_data = WikipediaService.enrich_album_data(
        album_title=album.title,
        artist_name=album.artist,
        genre=album.genre,
        producer_name=album.producer
    )

    # Update album with Wikipedia data
    album_update = AlbumUpdate(
        artist_bio=wiki_data["artist_bio"],
        album_story=wiki_data["album_story"],
        producer_bio=wiki_data["producer_bio"]
    )

    updated_album = crud_album.update_album(
        db, album_id=album_id, album_update=album_update
    )
    return updated_album


@router.post("/bulk-enrich-wikipedia")
def bulk_enrich_albums_with_wikipedia(
    background_tasks: BackgroundTasks,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Enrich multiple albums with Wikipedia data in the background
    This is useful for enriching the entire database
    """
    albums = crud_album.get_albums(db, skip=skip, limit=limit)

    def enrich_albums():
        for album in albums:
            try:
                wiki_data = WikipediaService.enrich_album_data(
                    album_title=album.title,
                    artist_name=album.artist,
                    genre=album.genre,
                    producer_name=album.producer
                )

                album_update = AlbumUpdate(
                    artist_bio=wiki_data["artist_bio"],
                    album_story=wiki_data["album_story"],
                    producer_bio=wiki_data["producer_bio"]
                )

                crud_album.update_album(
                    db, album_id=album.id, album_update=album_update
                )
            except Exception as e:
                print(f"Error enriching album {album.id}: {str(e)}")
                continue

    background_tasks.add_task(enrich_albums)

    message = (
        f"Started enriching {len(albums)} albums with Wikipedia data "
        "in the background"
    )
    return {
        "message": message,
        "albums_count": len(albums)
    }
