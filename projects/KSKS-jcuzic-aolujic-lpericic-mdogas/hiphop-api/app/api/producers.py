from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.producer import Producer, ProducerCreate
from app.schemas.album import Album
from app.crud import producer as crud_producer

router = APIRouter(prefix="/producers", tags=["Producers"])

@router.get("/", response_model=List[Producer])
def get_producers(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Dohvati sve producente"""
    producers = crud_producer.get_producers(db, skip=skip, limit=limit)
    return producers

@router.get("/top", response_model=List[Producer])
def get_top_producers(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Top producenti po broju albuma"""
    producers = crud_producer.get_top_producers(db, limit=limit)
    return producers

@router.get("/{producer_id}", response_model=Producer)
def get_producer(producer_id: int, db: Session = Depends(get_db)):
    """Detalji producenta"""
    producer = crud_producer.get_producer(db, producer_id=producer_id)
    if not producer:
        raise HTTPException(status_code=404, detail="Producent nije pronađen")
    return producer

@router.get("/{producer_id}/albums", response_model=List[Album])
def get_producer_albums(producer_id: int, db: Session = Depends(get_db)):
    """Albumi koje je producirao"""
    producer = crud_producer.get_producer(db, producer_id=producer_id)
    if not producer:
        raise HTTPException(status_code=404, detail="Producent nije pronađen")
    
    albums = crud_producer.get_producer_albums(db, producer_id=producer_id)
    return albums

@router.post("/", response_model=Producer)
def create_producer(producer: ProducerCreate, db: Session = Depends(get_db)):
    """Kreiraj novog producenta"""
    # Provjeri da li već postoji
    existing = crud_producer.get_producer_by_name(db, name=producer.name)
    if existing:
        raise HTTPException(status_code=400, detail="Producent već postoji")
    
    return crud_producer.create_producer(db=db, producer=producer)