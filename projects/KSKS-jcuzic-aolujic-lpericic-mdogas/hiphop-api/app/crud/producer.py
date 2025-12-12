from sqlalchemy.orm import Session
from app.models.producer import Producer
from app.schemas.producer import ProducerCreate
from typing import Optional

def get_producer(db: Session, producer_id: int):
    return db.query(Producer).filter(Producer.id == producer_id).first()

def get_producer_by_name(db: Session, name: str):
    return db.query(Producer).filter(Producer.name == name).first()

def get_producers(db: Session, skip: int = 0, limit: int = 50):
    return db.query(Producer).offset(skip).limit(limit).all()  # <-- Makni "query ="

def create_producer(db: Session, producer: ProducerCreate):
    db_producer = Producer(**producer.dict())
    db.add(db_producer)
    db.commit()
    db.refresh(db_producer)
    return db_producer

def get_producer_albums(db: Session, producer_id: int):
    from app.models.album import Album
    return db.query(Album).filter(Album.producer_id == producer_id).all()

def get_top_producers(db: Session, limit: int = 10):
    """Top producenti po broju albuma"""
    from app.models.album import Album
    from sqlalchemy import func
    
    return db.query(Producer).join(Album).group_by(Producer.id).order_by(
        func.count(Album.id).desc()
    ).limit(limit).all()