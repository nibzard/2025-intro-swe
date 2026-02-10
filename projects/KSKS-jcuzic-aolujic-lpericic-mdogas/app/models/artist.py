from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Artist(Base):
    __tablename__ = "artists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    region = Column(String, nullable=False)
    era = Column(String)
    genre = Column(String)  # hip_hop, prog_rock, jazz, etc.
    image_url = Column(String)
    
    # Manual data (fallback)
    biography = Column(Text)
    fun_facts = Column(Text)
    
    # Wikipedia data (auto-fetched)
    wikipedia_bio = Column(Text)  # ✨ NOVO
    
    influence_score = Column(Float, default=0.0)