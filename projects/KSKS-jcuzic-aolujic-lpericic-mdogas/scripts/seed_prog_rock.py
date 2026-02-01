#!/usr/bin/env python3
"""
Seed script to add Progressive Rock albums to the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.album import Album

# Create tables
Base.metadata.create_all(bind=engine)

def seed_prog_rock_albums():
    db: Session = SessionLocal()

    prog_rock_albums = [
        {
            "title": "The Dark Side of the Moon",
            "artist": "Pink Floyd",
            "year": 1973,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "Pink Floyd",
            "label": "Harvest Records",
            "description": "One of the most successful and influential albums ever made. Features iconic tracks exploring themes of conflict, greed, time, and mental illness."
        },
        {
            "title": "Close to the Edge",
            "artist": "Yes",
            "year": 1972,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "Yes & Eddy Offord",
            "label": "Atlantic Records",
            "description": "A masterpiece of progressive rock featuring complex arrangements and the 18-minute title track."
        },
        {
            "title": "In the Court of the Crimson King",
            "artist": "King Crimson",
            "year": 1969,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "King Crimson",
            "label": "Island Records",
            "description": "Considered one of the first progressive rock albums, blending rock, jazz, and classical music."
        },
        {
            "title": "Selling England by the Pound",
            "artist": "Genesis",
            "year": 1973,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "John Burns & Genesis",
            "label": "Charisma Records",
            "description": "Genesis at their progressive peak, featuring intricate compositions and Peter Gabriel's theatrical vocals."
        },
        {
            "title": "2112",
            "artist": "Rush",
            "year": 1976,
            "genre": "prog_rock",
            "region": "canada",
            "producer": "Rush & Terry Brown",
            "label": "Mercury Records",
            "description": "Rush's breakthrough album featuring the epic 20-minute title track, a rock opera about individuality and freedom."
        },
        {
            "title": "Fragile",
            "artist": "Yes",
            "year": 1971,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "Yes & Eddy Offord",
            "label": "Atlantic Records",
            "description": "Features 'Roundabout' and Rick Wakeman's first album with the band, showcasing virtuoso musicianship."
        },
        {
            "title": "The Wall",
            "artist": "Pink Floyd",
            "year": 1979,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "Bob Ezrin, David Gilmour, Roger Waters",
            "label": "Harvest Records",
            "description": "A rock opera about isolation and abandonment, featuring 'Another Brick in the Wall' and 'Comfortably Numb'."
        },
        {
            "title": "Red",
            "artist": "King Crimson",
            "year": 1974,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "King Crimson",
            "label": "Island Records",
            "description": "Heavy and dark prog rock masterpiece, influencing metal and alternative rock for decades to come."
        },
        {
            "title": "A Farewell to Kings",
            "artist": "Rush",
            "year": 1977,
            "genre": "prog_rock",
            "region": "canada",
            "producer": "Rush & Terry Brown",
            "label": "Mercury Records",
            "description": "Features 'Xanadu' and 'Closer to the Heart', showcasing Rush's progressive and conceptual approach."
        },
        {
            "title": "Thick as a Brick",
            "artist": "Jethro Tull",
            "year": 1972,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "Ian Anderson & Terry Ellis",
            "label": "Chrysalis Records",
            "description": "A single continuous piece of music spanning two sides of an LP, a parody and celebration of prog rock."
        },
        {
            "title": "Emerson, Lake & Palmer",
            "artist": "Emerson, Lake & Palmer",
            "year": 1970,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "Greg Lake",
            "label": "Island Records",
            "description": "The debut album of one of prog rock's premier supergroups, blending classical and rock."
        },
        {
            "title": "Wish You Were Here",
            "artist": "Pink Floyd",
            "year": 1975,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "Pink Floyd",
            "label": "Harvest Records",
            "description": "A tribute to former bandmate Syd Barrett, featuring 'Shine On You Crazy Diamond' and the title track."
        },
        {
            "title": "Foxtrot",
            "artist": "Genesis",
            "year": 1972,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "David Hitchcock",
            "label": "Charisma Records",
            "description": "Features the epic 23-minute 'Supper's Ready', one of prog rock's most ambitious compositions."
        },
        {
            "title": "Moving Pictures",
            "artist": "Rush",
            "year": 1981,
            "genre": "prog_rock",
            "region": "canada",
            "producer": "Rush & Terry Brown",
            "label": "Mercury Records",
            "description": "Rush's most commercially successful album featuring 'Tom Sawyer', 'Limelight', and 'YYZ'."
        },
        {
            "title": "Brain Salad Surgery",
            "artist": "Emerson, Lake & Palmer",
            "year": 1973,
            "genre": "prog_rock",
            "region": "uk",
            "producer": "ELP & Greg Lake",
            "label": "Manticore Records",
            "description": "Features 'Karn Evil 9' and showcases the band's technical prowess and synthesizer innovations."
        }
    ]

    # Check which albums already exist
    existing_titles = {album.title for album in db.query(Album).filter(Album.genre == "prog_rock").all()}

    added_count = 0
    for album_data in prog_rock_albums:
        if album_data["title"] not in existing_titles:
            album = Album(**album_data)
            db.add(album)
            added_count += 1
            print(f"✅ Added: {album_data['artist']} - {album_data['title']}")
        else:
            print(f"⚠️  Already exists: {album_data['title']}")

    db.commit()
    db.close()

    print(f"\n🎸 Added {added_count} prog rock albums to the database!")

if __name__ == "__main__":
    seed_prog_rock_albums()
