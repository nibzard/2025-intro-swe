#!/usr/bin/env python3
"""
Seed script to add Classic Rock albums to the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.album import Album

# Create tables
Base.metadata.create_all(bind=engine)

def seed_classic_rock_albums():
    db: Session = SessionLocal()

    classic_rock_albums = [
        {
            "title": "Led Zeppelin IV",
            "artist": "Led Zeppelin",
            "year": 1971,
            "genre": "classic_rock",
            "region": "uk",
            "producer": "Jimmy Page",
            "label": "Atlantic Records",
            "cover_url": "https://m.media-amazon.com/images/I/71W38gD3cxL._UF1000,1000_QL80_.jpg",
            "description": "Features 'Stairway to Heaven', one of the most iconic rock songs ever recorded."
        },
        {
            "title": "Abbey Road",
            "artist": "The Beatles",
            "year": 1969,
            "genre": "classic_rock",
            "region": "uk",
            "producer": "George Martin",
            "label": "Apple Records",
            "cover_url": "https://m.media-amazon.com/images/I/81ay3UT7daL._UF1000,1000_QL80_.jpg",
            "description": "The Beatles' penultimate album featuring 'Come Together' and 'Here Comes the Sun'."
        },
        {
            "title": "Rumours",
            "artist": "Fleetwood Mac",
            "year": 1977,
            "genre": "classic_rock",
            "region": "uk",
            "producer": "Fleetwood Mac, Ken Caillat, Richard Dashut",
            "label": "Warner Bros. Records",
            "cover_url": "https://m.media-amazon.com/images/I/81dQ93ZEcnL._UF1000,1000_QL80_.jpg",
            "description": "One of the best-selling albums of all time, featuring 'Go Your Own Way' and 'Dreams'."
        },
        {
            "title": "Back in Black",
            "artist": "AC/DC",
            "year": 1980,
            "genre": "classic_rock",
            "region": "australia",
            "producer": "Robert John 'Mutt' Lange",
            "label": "Atlantic Records",
            "cover_url": "https://m.media-amazon.com/images/I/71EjbZ3eNCL._UF1000,1000_QL80_.jpg",
            "description": "AC/DC's tribute to Bon Scott and one of the best-selling albums in history."
        },
        {
            "title": "Hotel California",
            "artist": "Eagles",
            "year": 1976,
            "genre": "classic_rock",
            "region": "west_coast",
            "producer": "Bill Szymczyk",
            "label": "Asylum Records",
            "cover_url": "https://m.media-amazon.com/images/I/51mRyofHA5L._UF1000,1000_QL80_.jpg",
            "description": "Features the iconic title track with one of rock's most famous guitar solos."
        },
        {
            "title": "The Who - Who's Next",
            "artist": "The Who",
            "year": 1971,
            "genre": "classic_rock",
            "region": "uk",
            "producer": "The Who, Glyn Johns",
            "label": "Decca Records",
            "cover_url": "https://m.media-amazon.com/images/I/81yLKZ4QHQL._UF1000,1000_QL80_.jpg",
            "description": "Features 'Baba O'Riley' and 'Won't Get Fooled Again', rock anthems that defined an era."
        },
        {
            "title": "Appetite for Destruction",
            "artist": "Guns N' Roses",
            "year": 1987,
            "genre": "classic_rock",
            "region": "west_coast",
            "producer": "Mike Clink",
            "label": "Geffen Records",
            "cover_url": "https://m.media-amazon.com/images/I/81S4U3-S+dL._UF1000,1000_QL80_.jpg",
            "description": "The best-selling debut album of all time featuring 'Sweet Child O' Mine' and 'Welcome to the Jungle'."
        },
        {
            "title": "Born to Run",
            "artist": "Bruce Springsteen",
            "year": 1975,
            "genre": "classic_rock",
            "region": "east_coast",
            "producer": "Bruce Springsteen, Jon Landau, Mike Appel",
            "label": "Columbia Records",
            "cover_url": "https://m.media-amazon.com/images/I/81HyxhNE3cL._UF1000,1000_QL80_.jpg",
            "description": "Springsteen's breakthrough album with anthems of working-class America."
        },
        {
            "title": "The Joshua Tree",
            "artist": "U2",
            "year": 1987,
            "genre": "classic_rock",
            "region": "ireland",
            "producer": "Daniel Lanois, Brian Eno",
            "label": "Island Records",
            "cover_url": "https://m.media-amazon.com/images/I/715eEbsA5hL._UF1000,1000_QL80_.jpg",
            "description": "U2's masterpiece featuring 'With or Without You' and 'Where the Streets Have No Name'."
        },
        {
            "title": "Boston",
            "artist": "Boston",
            "year": 1976,
            "genre": "classic_rock",
            "region": "east_coast",
            "producer": "Tom Scholz, John Boylan",
            "label": "Epic Records",
            "cover_url": "https://m.media-amazon.com/images/I/81wJKV+IzLL._UF1000,1000_QL80_.jpg",
            "description": "One of the best-selling debut albums featuring 'More Than a Feeling'."
        }
    ]

    # Check which albums already exist
    existing_titles = {album.title for album in db.query(Album).filter(Album.genre == "classic_rock").all()}

    added_count = 0
    for album_data in classic_rock_albums:
        if album_data["title"] not in existing_titles:
            album = Album(**album_data)
            db.add(album)
            added_count += 1
            print(f"✅ Added: {album_data['artist']} - {album_data['title']}")
        else:
            print(f"⚠️  Already exists: {album_data['title']}")

    db.commit()
    db.close()

    print(f"\n🎸 Added {added_count} classic rock albums to the database!")

if __name__ == "__main__":
    seed_classic_rock_albums()
