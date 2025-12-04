from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    artist_id = Column(Integer, ForeignKey("artists.id"))  # ✨ NOVO
    year = Column(Integer, nullable=False, index=True)
    region = Column(String, nullable=False, index=True)
    producer_id = Column(Integer, ForeignKey("producers.id"))  # ✨ NOVO
    label = Column(String)
    cover_url = Column(String)
    
    # ✨ NOVE KOLONE umjesto description
    story = Column(Text)  # Priča kako je album nastao
    impact = Column(Text)  # Zašto je legendaran
    trivia = Column(Text)  # Zanimljivosti
    
    avg_rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)
    
    # Relacije
    artist = relationship("Artist", backref="albums")  # ✨ NOVO
    producer = relationship("Producer", backref="albums")  # ✨ NOVO