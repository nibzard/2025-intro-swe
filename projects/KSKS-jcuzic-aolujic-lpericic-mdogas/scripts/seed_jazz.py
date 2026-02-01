#!/usr/bin/env python3
"""
Seed script to add Jazz albums to the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.album import Album

# Create tables
Base.metadata.create_all(bind=engine)

def seed_jazz_albums():
    db: Session = SessionLocal()

    jazz_albums = [
        {
            "title": "Kind of Blue",
            "artist": "Miles Davis",
            "year": 1959,
            "genre": "jazz",
            "region": "east_coast",
            "producer": "Teo Macero, Irving Townsend",
            "label": "Columbia Records",
            "cover_url": "https://m.media-amazon.com/images/I/71VhZ6lFa4L._UF1000,1000_QL80_.jpg",
            "description": "The best-selling jazz album of all time, a masterpiece of modal jazz."
        },
        {
            "title": "A Love Supreme",
            "artist": "John Coltrane",
            "year": 1965,
            "genre": "jazz",
            "region": "east_coast",
            "producer": "Bob Thiele",
            "label": "Impulse! Records",
            "cover_url": "https://m.media-amazon.com/images/I/71wjVJ3qTwL._UF1000,1000_QL80_.jpg",
            "description": "Coltrane's spiritual masterpiece, considered one of the greatest jazz albums ever."
        },
        {
            "title": "Giant Steps",
            "artist": "John Coltrane",
            "year": 1960,
            "genre": "jazz",
            "region": "east_coast",
            "producer": "Nesuhi Ertegun",
            "label": "Atlantic Records",
            "cover_url": "https://m.media-amazon.com/images/I/71S+4sDCEjL._UF1000,1000_QL80_.jpg",
            "description": "Revolutionary album showcasing Coltrane's technical brilliance and the famous 'Coltrane changes'."
        },
        {
            "title": "Time Out",
            "artist": "The Dave Brubeck Quartet",
            "year": 1959,
            "genre": "jazz",
            "region": "west_coast",
            "producer": "Teo Macero",
            "label": "Columbia Records",
            "cover_url": "https://m.media-amazon.com/images/I/81wh8xT6lkL._UF1000,1000_QL80_.jpg",
            "description": "Features 'Take Five', one of the most recognizable jazz compositions ever recorded."
        },
        {
            "title": "Mingus Ah Um",
            "artist": "Charles Mingus",
            "year": 1959,
            "genre": "jazz",
            "region": "east_coast",
            "producer": "Teo Macero",
            "label": "Columbia Records",
            "cover_url": "https://m.media-amazon.com/images/I/81W-GtUvYdL._UF1000,1000_QL80_.jpg",
            "description": "Mingus's masterpiece blending bebop, gospel, and classical influences."
        },
        {
            "title": "The Black Saint and the Sinner Lady",
            "artist": "Charles Mingus",
            "year": 1963,
            "genre": "jazz",
            "region": "east_coast",
            "producer": "Teo Macero",
            "label": "Impulse! Records",
            "cover_url": "https://m.media-amazon.com/images/I/81GIU4NdG1L._UF1000,1000_QL80_.jpg",
            "description": "An ambitious jazz ballet, one of Mingus's most complex and emotional works."
        },
        {
            "title": "Head Hunters",
            "artist": "Herbie Hancock",
            "year": 1973,
            "genre": "jazz",
            "region": "west_coast",
            "producer": "David Rubinson, Herbie Hancock",
            "label": "Columbia Records",
            "cover_url": "https://m.media-amazon.com/images/I/81P0LQkNj0L._UF1000,1000_QL80_.jpg",
            "description": "Pioneering jazz-funk fusion album featuring 'Chameleon'."
        },
        {
            "title": "Blue Train",
            "artist": "John Coltrane",
            "year": 1958,
            "genre": "jazz",
            "region": "east_coast",
            "producer": "Alfred Lion",
            "label": "Blue Note Records",
            "cover_url": "https://m.media-amazon.com/images/I/71H1R6TypsL._UF1000,1000_QL80_.jpg",
            "description": "A hard bop masterpiece and Coltrane's sole Blue Note recording as leader."
        },
        {
            "title": "Ella & Louis",
            "artist": "Ella Fitzgerald & Louis Armstrong",
            "year": 1956,
            "genre": "jazz",
            "region": "west_coast",
            "producer": "Norman Granz",
            "label": "Verve Records",
            "cover_url": "https://m.media-amazon.com/images/I/81LtxjTGT6L._UF1000,1000_QL80_.jpg",
            "description": "The perfect collaboration between two jazz legends."
        },
        {
            "title": "Bitches Brew",
            "artist": "Miles Davis",
            "year": 1970,
            "genre": "jazz",
            "region": "east_coast",
            "producer": "Teo Macero",
            "label": "Columbia Records",
            "cover_url": "https://m.media-amazon.com/images/I/81BYeqTuXfL._UF1000,1000_QL80_.jpg",
            "description": "Groundbreaking fusion of jazz and rock that changed music forever."
        }
    ]

    # Check which albums already exist
    existing_titles = {album.title for album in db.query(Album).filter(Album.genre == "jazz").all()}

    added_count = 0
    for album_data in jazz_albums:
        if album_data["title"] not in existing_titles:
            album = Album(**album_data)
            db.add(album)
            added_count += 1
            print(f"✅ Added: {album_data['artist']} - {album_data['title']}")
        else:
            print(f"⚠️  Already exists: {album_data['title']}")

    db.commit()
    db.close()

    print(f"\n🎷 Added {added_count} jazz albums to the database!")

if __name__ == "__main__":
    seed_jazz_albums()
