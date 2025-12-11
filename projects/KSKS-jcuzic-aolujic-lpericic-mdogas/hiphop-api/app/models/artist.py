from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Artist(Base):
    __tablename__ = "artists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    region = Column(String, nullable=False)  # east_coast, west_coast, south
    era = Column(String)  # golden_age, late_90s, early_2000s
    image_url = Column(String)
    biography = Column(Text)  # Životopis
    fun_facts = Column(Text)  # Zanimljivosti
    influence_score = Column(Float, default=0.0)  # Koliko je utjecajan (0-10)