from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.comment import Comment, CommentCreate, CommentUpdate
from app.crud import comment as crud_comment
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.get("/album/{album_id}", response_model=List[dict])
def get_album_comments(
    album_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all comments for an album"""
    comments = crud_comment.get_album_comments(db, album_id=album_id, skip=skip, limit=limit)
    return comments

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new comment (requires authentication)"""
    db_comment = crud_comment.create_comment(db, comment=comment, user_id=current_user.id)
    
    # Return comment with username
    return {
        "id": db_comment.id,
        "album_id": db_comment.album_id,
        "user_id": db_comment.user_id,
        "username": current_user.username,
        "content": db_comment.content,
        "created_at": db_comment.created_at,
        "updated_at": db_comment.updated_at
    }

@router.put("/{comment_id}")
def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a comment (only by owner)"""
    db_comment = crud_comment.get_comment(db, comment_id=comment_id)
    
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if db_comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    updated = crud_comment.update_comment(db, comment_id=comment_id, comment_update=comment_update)
    
    return {
        "id": updated.id,
        "album_id": updated.album_id,
        "user_id": updated.user_id,
        "username": current_user.username,
        "content": updated.content,
        "created_at": updated.created_at,
        "updated_at": updated.updated_at
    }

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (only by owner)"""
    db_comment = crud_comment.get_comment(db, comment_id=comment_id)
    
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if db_comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    crud_comment.delete_comment(db, comment_id=comment_id)
    return None

@router.get("/user/{user_id}", response_model=List[Comment])
def get_user_comments(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all comments by a specific user"""
    comments = crud_comment.get_user_comments(db, user_id=user_id, skip=skip, limit=limit)
    return comments