from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.rating import Rating, RatingCreate
from app.crud import rating as crud_rating
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ratings", tags=["Ratings"])

@router.post("/", response_model=Rating)
def create_rating(
    rating: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud_rating.create_rating(db=db, rating=rating, user_id=current_user.id)

@router.get("/album/{album_id}", response_model=List[Rating])
def get_album_ratings(
    album_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return crud_rating.get_album_ratings(db, album_id=album_id, skip=skip, limit=limit)

@router.get("/me", response_model=List[Rating])
def get_my_ratings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud_rating.get_user_ratings(db, user_id=current_user.id)
