from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Producer(Base):
    __tablename__ = "producers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    signature_sound = Column(String)
    image_url = Column(String)
    
    # Manual data (fallback)
    biography = Column(Text)
    fun_facts = Column(Text)
    production_techniques = Column(Text)
    notable_albums = Column(Text)
    
    # Wikipedia data (auto-fetched)
    wikipedia_bio = Column(Text)  # ✨ NOVO