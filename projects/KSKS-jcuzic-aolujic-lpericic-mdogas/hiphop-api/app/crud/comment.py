from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentUpdate
from typing import List

def get_comment(db: Session, comment_id: int):
    """Get single comment by ID"""
    return db.query(Comment).filter(Comment.id == comment_id).first()

def get_album_comments(db: Session, album_id: int, skip: int = 0, limit: int = 50):
    """Get all comments for an album with user info"""
    comments = db.query(Comment).filter(
        Comment.album_id == album_id
    ).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()
    
    # Manually add username to each comment
    result = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        comment_dict = {
            "id": comment.id,
            "album_id": comment.album_id,
            "user_id": comment.user_id,
            "username": user.username if user else "Unknown",
            "content": comment.content,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at
        }
        result.append(comment_dict)
    
    return result

def get_user_comments(db: Session, user_id: int, skip: int = 0, limit: int = 50):
    """Get all comments by a user"""
    return db.query(Comment).filter(
        Comment.user_id == user_id
    ).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

def create_comment(db: Session, comment: CommentCreate, user_id: int):
    """Create new comment"""
    db_comment = Comment(
        album_id=comment.album_id,
        user_id=user_id,
        content=comment.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def update_comment(db: Session, comment_id: int, comment_update: CommentUpdate):
    """Update existing comment"""
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if db_comment:
        db_comment.content = comment_update.content
        db.commit()
        db.refresh(db_comment)
    return db_comment

def delete_comment(db: Session, comment_id: int):
    """Delete comment"""
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if db_comment:
        db.delete(db_comment)
        db.commit()
        return True
    return False