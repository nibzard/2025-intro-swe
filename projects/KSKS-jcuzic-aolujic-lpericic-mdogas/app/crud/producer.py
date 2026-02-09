from sqlalchemy.orm import Session
from app.models.producer import Producer
from app.schemas.producer import ProducerCreate
from typing import Optional

def get_producer(db: Session, producer_id: int):
    return db.query(Producer).filter(Producer.id == producer_id).first()

def get_producer_by_name(db: Session, name: str):
    return db.query(Producer).filter(Producer.name == name).first()

def get_producers(db: Session, skip: int = 0, limit: int = 50):
    return db.query(Producer).offset(skip).limit(limit).all()

def create_producer(db: Session, producer: ProducerCreate):
    db_producer = Producer(**producer.dict())
    db.add(db_producer)
    db.commit()
    db.refresh(db_producer)
    return db_producer

def get_producer_albums(db: Session, producer_id: int):
    """Get all albums by a producer - matches by producer name"""
    from app.models.album import Album
    
    # First get the producer to get their name
    producer = db.query(Producer).filter(Producer.id == producer_id).first()
    
    if not producer:
        return []
    
    # Find albums where producer name appears in the producer field
    # Since Album.producer can have multiple producers (e.g., "DJ Premier, Pete Rock")
    # we need to use LIKE to match partial names
    return db.query(Album).filter(Album.producer.like(f'%{producer.name}%')).all()

def get_top_producers(db: Session, limit: int = 10):
    """Top producers by number of albums"""
    from app.models.album import Album
    
    # Get all producers
    producers = db.query(Producer).all()
    
    # Count albums for each producer
    producer_counts = []
    for producer in producers:
        album_count = db.query(Album).filter(
            Album.producer.like(f'%{producer.name}%')
        ).count()
        
        if album_count > 0:
            producer_counts.append((producer, album_count))
    
    # Sort by count and return top N
    producer_counts.sort(key=lambda x: x[1], reverse=True)
    return [p[0] for p in producer_counts[:limit]]