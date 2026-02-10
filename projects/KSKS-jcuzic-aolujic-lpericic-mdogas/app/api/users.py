from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.schemas.user import User, UserProfile, UserStats
from app.crud import user as crud_user
from app.core.dependencies import get_current_user
from app.models.user import User as UserModel
from app.models.rating import Rating
from app.models.comment import Comment
from app.models.album import Album

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get current logged-in user's profile with stats"""
    
    # Count ratings
    total_ratings = db.query(Rating).filter(Rating.user_id == current_user.id).count()
    
    # Count comments
    total_comments = db.query(Comment).filter(Comment.user_id == current_user.id).count()
    
    # Average rating given
    avg_rating = db.query(func.avg(Rating.rating)).filter(
        Rating.user_id == current_user.id
    ).scalar() or 0.0
    
    # Favorite genre (most rated genre)
    favorite_genre_result = db.query(
        Album.genre, func.count(Rating.id).label('count')
    ).join(Rating, Album.id == Rating.album_id).filter(
        Rating.user_id == current_user.id
    ).group_by(Album.genre).order_by(func.count(Rating.id).desc()).first()
    
    favorite_genre = favorite_genre_result[0] if favorite_genre_result else None
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "total_ratings": total_ratings,
        "total_comments": total_comments,
        "avg_rating_given": round(avg_rating, 2),
        "favorite_genre": favorite_genre
    }

@router.get("/{user_id}", response_model=UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get any user's public profile"""
    
    user = crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count ratings
    total_ratings = db.query(Rating).filter(Rating.user_id == user_id).count()
    
    # Count comments
    total_comments = db.query(Comment).filter(Comment.user_id == user_id).count()
    
    # Average rating given
    avg_rating = db.query(func.avg(Rating.rating)).filter(
        Rating.user_id == user_id
    ).scalar() or 0.0
    
    # Favorite genre
    favorite_genre_result = db.query(
        Album.genre, func.count(Rating.id).label('count')
    ).join(Rating, Album.id == Rating.album_id).filter(
        Rating.user_id == user_id
    ).group_by(Album.genre).order_by(func.count(Rating.id).desc()).first()
    
    favorite_genre = favorite_genre_result[0] if favorite_genre_result else None
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at,
        "total_ratings": total_ratings,
        "total_comments": total_comments,
        "avg_rating_given": round(avg_rating, 2),
        "favorite_genre": favorite_genre
    }

@router.get("/{user_id}/ratings")
def get_user_ratings(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all albums rated by a user"""
    
    user = crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get ratings with album info
    ratings = db.query(Rating, Album).join(
        Album, Rating.album_id == Album.id
    ).filter(
        Rating.user_id == user_id
    ).order_by(Rating.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for rating, album in ratings:
        result.append({
            "rating_id": rating.id,
            "rating": rating.rating,
            "review": rating.review,
            "created_at": rating.created_at,
            "album": {
                "id": album.id,
                "title": album.title,
                "artist": album.artist,
                "year": album.year,
                "genre": album.genre,
                "cover_url": album.cover_url
            }
        })
    
    return result

@router.get("/{user_id}/comments")
def get_user_comments_with_albums(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all comments by a user with album info"""
    
    user = crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get comments with album info
    comments = db.query(Comment, Album).join(
        Album, Comment.album_id == Album.id
    ).filter(
        Comment.user_id == user_id
    ).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for comment, album in comments:
        result.append({
            "comment_id": comment.id,
            "content": comment.content,
            "created_at": comment.created_at,
            "album": {
                "id": album.id,
                "title": album.title,
                "artist": album.artist,
                "year": album.year,
                "cover_url": album.cover_url
            }
        })
    
    return result

@router.get("/me/stats", response_model=UserStats)
def get_my_detailed_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get detailed statistics for current user"""
    
    # Genre breakdown
    genre_stats = db.query(
        Album.genre, 
        func.count(Rating.id).label('count'),
        func.avg(Rating.rating).label('avg_rating')
    ).join(Rating, Album.id == Rating.album_id).filter(
        Rating.user_id == current_user.id
    ).group_by(Album.genre).all()
    
    genre_breakdown = {
        genre: {
            "count": count,
            "avg_rating": round(float(avg_rating), 2)
        }
        for genre, count, avg_rating in genre_stats
    }
    
    # Recent activity (last 10 ratings)
    recent_ratings = db.query(Rating, Album).join(
        Album, Rating.album_id == Album.id
    ).filter(
        Rating.user_id == current_user.id
    ).order_by(Rating.created_at.desc()).limit(10).all()
    
    recent_activity = [
        {
            "album_title": album.title,
            "artist": album.artist,
            "rating": rating.rating,
            "date": rating.created_at
        }
        for rating, album in recent_ratings
    ]
    
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "genre_breakdown": genre_breakdown,
        "recent_activity": recent_activity
    }