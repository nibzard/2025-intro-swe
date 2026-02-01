from pydantic import BaseModel
from datetime import datetime

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    album_id: int

class CommentUpdate(BaseModel):
    content: str

class Comment(CommentBase):
    id: int
    album_id: int
    user_id: int
    username: str  # Will be added manually in response
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class CommentWithUser(Comment):
    """Comment with user info included"""
    pass