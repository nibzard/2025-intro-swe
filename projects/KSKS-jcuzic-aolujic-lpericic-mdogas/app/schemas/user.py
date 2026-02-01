from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class UserProfile(User):
    """Extended user info with statistics"""
    total_ratings: int = 0
    total_comments: int = 0
    avg_rating_given: float = 0.0
    favorite_genre: str | None = None

class UserStats(BaseModel):
    """Detailed user statistics"""
    user_id: int
    username: str
    genre_breakdown: dict  # {"hip_hop": {"count": 5, "avg_rating": 4.2}, ...}
    recent_activity: list  # Recent ratings

    class Config:
        from_attributes = True