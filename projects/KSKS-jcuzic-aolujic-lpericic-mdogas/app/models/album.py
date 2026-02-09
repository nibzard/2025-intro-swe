from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    artist = Column(String, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    genre = Column(String, nullable=False, index=True)  # hip_hop, prog_rock, classic_rock, etc.
    region = Column(String, index=True)  # Optional: east_coast, west_coast, uk, etc.
    producer = Column(String)
    label = Column(String)
    cover_url = Column(String)
    description = Column(Text)
    avg_rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)

    # Wikipedia data
    artist_bio = Column(Text)  # Artist biography from Wikipedia
    album_story = Column(Text)  # Album backstory/history from Wikipedia
    producer_bio = Column(Text)  # Producer biography from Wikipedia
