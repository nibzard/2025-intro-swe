from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Producer(Base):
    __tablename__ = "producers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    signature_sound = Column(String)  # boom bap, g-funk, soul samples
    image_url = Column(String)
    biography = Column(Text)  # Životopis
    fun_facts = Column(Text)  # Zanimljivosti
    production_techniques = Column(Text)  # Tehnike produkcije
    notable_albums = Column(Text)  # Najznačajniji albumi (JSON lista)