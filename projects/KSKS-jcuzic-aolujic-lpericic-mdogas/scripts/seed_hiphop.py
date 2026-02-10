#!/usr/bin/env python3
"""
Seed script to add Hip Hop albums to the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.album import Album

# Create tables
Base.metadata.create_all(bind=engine)


def seed_hip_hop_albums():
    db: Session = SessionLocal()

    hip_hop_albums = [
        {
            "title": "Illmatic",
            "artist": "Nas",
            "year": 1994,
            "genre": "hip_hop",
            "region": "east_coast",
            "producer": "DJ Premier, Pete Rock, Q-Tip, L.E.S.",
            "label": "Columbia Records",
            "cover_url": "https://m.media-amazon.com/images/I/71b7r+RZ1EL._UF1000,1000_QL80_.jpg",
            "description": "Widely regarded as one of the greatest hip hop albums of all time."
        },
        {
            "title": "The Chronic",
            "artist": "Dr. Dre",
            "year": 1992,
            "genre": "hip_hop",
            "region": "west_coast",
            "producer": "Dr. Dre",
            "label": "Death Row Records",
            "cover_url": "https://m.media-amazon.com/images/I/81Xg8Zl0eUL._UF1000,1000_QL80_.jpg",
            "description": "A landmark West Coast hip hop album that popularized G-funk."
        },
        {
            "title": "Ready to Die",
            "artist": "The Notorious B.I.G.",
            "year": 1994,
            "genre": "hip_hop",
            "region": "east_coast",
            "producer": "Sean Combs, Easy Mo Bee",
            "label": "Bad Boy Records",
            "cover_url": "https://m.media-amazon.com/images/I/71YF1d3HfPL._UF1000,1000_QL80_.jpg",
            "description": "Biggie’s debut album that reshaped East Coast hip hop."
        },
        {
            "title": "ATLiens",
            "artist": "OutKast",
            "year": 1996,
            "genre": "hip_hop",
            "region": "south",
            "producer": "Organized Noize",
            "label": "LaFace Records",
            "cover_url": "https://m.media-amazon.com/images/I/71y4z5Zz2LL._UF1000,1000_QL80_.jpg",
            "description": "A defining album of Southern hip hop with a futuristic sound."
        },

        {
            "title": "All Eyez on Me",
            "artist": "2Pac",
            "year": 1996,
            "genre": "hip_hop",
            "region": "west_coast",
            "producer": "Dr. Dre, Johnny J, Daz Dillinger",
            "label": "Death Row Records",
            "cover_url": "https://m.media-amazon.com/images/I/71H1R6TypsL._UF1000,1000_QL80_.jpg",
            "description": "A double album that cemented Tupac as a global hip hop icon."
        },
        {
            "title": "Enter the Wu-Tang (36 Chambers)",
            "artist": "Wu-Tang Clan",
            "year": 1993,
            "genre": "hip_hop",
            "region": "east_coast",
            "producer": "RZA",
            "label": "Loud Records",
            "cover_url": "https://m.media-amazon.com/images/I/81BYeqTuXfL._UF1000,1000_QL80_.jpg",
            "description": "A raw and influential debut that changed hip hop forever."
        },
        {
            "title": "The Low End Theory",
            "artist": "A Tribe Called Quest",
            "year": 1991,
            "genre": "hip_hop",
            "region": "east_coast",
            "producer": "A Tribe Called Quest",
            "label": "Jive Records",
            "cover_url": "https://m.media-amazon.com/images/I/81P0LQkNj0L._UF1000,1000_QL80_.jpg",
            "description": "A jazz-infused classic that pushed hip hop into new territory."
        },
        {
            "title": "Paid in Full",
            "artist": "Eric B. & Rakim",
            "year": 1987,
            "genre": "hip_hop",
            "region": "east_coast",
            "producer": "Eric B.",
            "label": "4th & B'way",
            "cover_url": "https://m.media-amazon.com/images/I/81GIU4NdG1L._UF1000,1000_QL80_.jpg",
            "description": "A foundational album that elevated lyricism and flow."
        },
        {
            "title": "Good Kid, M.A.A.D City",
            "artist": "Kendrick Lamar",
            "year": 2012,
            "genre": "hip_hop",
            "region": "west_coast",
            "producer": "Dr. Dre, Hit-Boy, Pharrell Williams",
            "label": "Aftermath Entertainment",
            "cover_url": "https://m.media-amazon.com/images/I/81wh8xT6lkL._UF1000,1000_QL80_.jpg",
            "description": "A modern hip hop masterpiece with cinematic storytelling."
        },
        {
            "title": "It Takes a Nation of Millions to Hold Us Back",
            "artist": "Public Enemy",
            "year": 1988,
            "genre": "hip_hop",
            "region": "east_coast",
            "producer": "The Bomb Squad",
            "label": "Def Jam Recordings",
            "cover_url": "https://m.media-amazon.com/images/I/81W-GtUvYdL._UF1000,1000_QL80_.jpg",
            "description": "A politically charged album that expanded hip hop’s voice."
        }
    ]

    existing_titles = {
        album.title for album in db.query(Album).filter(Album.genre == "hip_hop").all()
    }

    added_count = 0
    for album_data in hip_hop_albums:
        if album_data["title"] not in existing_titles:
            album = Album(**album_data)
            db.add(album)
            added_count += 1
            print(f"✅ Added: {album_data['artist']} - {album_data['title']}")
        else:
            print(f"⚠️  Already exists: {album_data['title']}")

    db.commit()
    db.close()

    print(f"\n🎤 Added {added_count} hip hop albums to the database!")


if __name__ == "__main__":
    seed_hip_hop_albums()
