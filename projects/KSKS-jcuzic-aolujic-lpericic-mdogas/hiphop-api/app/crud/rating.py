from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.rating import Rating
from app.models.album import Album
from app.schemas.rating import RatingCreate

def create_rating(db: Session, rating: RatingCreate, user_id: int):
    # Provjeri da li user vec ima rating za ovaj album
    existing = db.query(Rating).filter(
        Rating.album_id == rating.album_id,
        Rating.user_id == user_id
    ).first()
    
    if existing:
        # Update postojeci rating
        existing.rating = rating.rating
        existing.review = rating.review
        db.commit()
        db.refresh(existing)
        db_rating = existing
    else:
        # Kreiraj novi rating
        db_rating = Rating(
            album_id=rating.album_id,
            user_id=user_id,
            rating=rating.rating,
            review=rating.review
        )
        db.add(db_rating)
        db.commit()
        db.refresh(db_rating)
    
    # Update album average rating
    update_album_rating(db, rating.album_id)
    
    return db_rating

def update_album_rating(db: Session, album_id: int):
    result = db.query(
        func.avg(Rating.rating).label('avg'),
        func.count(Rating.id).label('count')
    ).filter(Rating.album_id == album_id).first()
    
    album = db.query(Album).filter(Album.id == album_id).first()
    if album:
        album.avg_rating = float(result.avg) if result.avg else 0.0
        album.total_ratings = result.count
        db.commit()

def get_album_ratings(db: Session, album_id: int, skip: int = 0, limit: int = 10):
    return db.query(Rating).filter(
        Rating.album_id == album_id
    ).offset(skip).limit(limit).all()

def get_user_ratings(db: Session, user_id: int):
    return db.query(Rating).filter(Rating.user_id == user_id).all()
