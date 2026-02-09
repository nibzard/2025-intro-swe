#!/usr/bin/env python3
"""
Seed script to automatically fetch albums from Spotify and add them to the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.album import Album
from app.core.spotify_service import spotify_service

# Create tables
Base.metadata.create_all(bind=engine)


# Define albums you want to fetch from Spotify
# Format: (album_name, artist_name, genre, region)
ALBUMS_TO_FETCH = [
    # Hip Hop Albums
    ("Illmatic", "Nas", "hip_hop", "east_coast"),
    ("The Chronic", "Dr. Dre", "hip_hop", "west_coast"),
    ("Ready to Die", "The Notorious B.I.G.", "hip_hop", "east_coast"),
    ("Enter the Wu-Tang (36 Chambers)", "Wu-Tang Clan", "hip_hop", "east_coast"),
    ("All Eyez on Me", "2Pac", "hip_hop", "west_coast"),
    ("The Miseducation of Lauryn Hill", "Lauryn Hill", "hip_hop", "east_coast"),
    ("ATLiens", "OutKast", "hip_hop", "south"),

    # Jazz Albums
    ("Kind of Blue", "Miles Davis", "jazz", "east_coast"),
    ("A Love Supreme", "John Coltrane", "jazz", "east_coast"),
    ("Time Out", "Dave Brubeck", "jazz", "west_coast"),
    ("Mingus Ah Um", "Charles Mingus", "jazz", "east_coast"),

    # Classic Rock Albums
    ("The Dark Side of the Moon", "Pink Floyd", "classic_rock", "uk"),
    ("Led Zeppelin IV", "Led Zeppelin", "classic_rock", "uk"),
    ("Abbey Road", "The Beatles", "classic_rock", "uk"),
    ("Rumours", "Fleetwood Mac", "classic_rock", "west_coast"),

    # Progressive Rock Albums
    ("Close to the Edge", "Yes", "prog_rock", "uk"),
    ("In the Court of the Crimson King", "King Crimson", "prog_rock", "uk"),
    ("The Wall", "Pink Floyd", "prog_rock", "uk"),
]


def fetch_and_seed_albums():
    """Fetch albums from Spotify and add them to the database"""
    db: Session = SessionLocal()

    print("🎵 Starting to fetch albums from Spotify...\n")

    added_count = 0
    skipped_count = 0
    failed_count = 0

    for album_name, artist_name, genre, region in ALBUMS_TO_FETCH:
        print(f"🔍 Searching: {album_name} by {artist_name}...")

        # Check if album already exists
        existing = db.query(Album).filter(
            Album.title == album_name,
            Album.artist == artist_name
        ).first()

        if existing:
            print(f"⚠️  Already exists: {album_name}\n")
            skipped_count += 1
            continue

        # Fetch from Spotify
        try:
            album_data = spotify_service.get_album_by_name_and_artist(album_name, artist_name)

            if album_data:
                # Create album record
                album = Album(
                    title=album_data['title'],
                    artist=album_data['artist'],
                    year=album_data['year'],
                    genre=genre,
                    region=region,
                    label=album_data.get('label', ''),
                    cover_url=album_data['cover_url'],
                    description=f"Spotify popularity: {album_data['popularity']}/100. Total tracks: {album_data['total_tracks']}."
                )

                db.add(album)
                db.commit()

                print(f"✅ Added: {album.artist} - {album.title} ({album.year})")
                print(f"   Cover: {album.cover_url[:50]}...")
                print(f"   Label: {album.label}\n")
                added_count += 1
            else:
                print(f"❌ Not found on Spotify: {album_name}\n")
                failed_count += 1

        except Exception as e:
            print(f"❌ Error fetching {album_name}: {e}\n")
            failed_count += 1
            continue

    db.close()

    # Summary
    print("=" * 60)
    print("📊 Summary:")
    print(f"   ✅ Added: {added_count}")
    print(f"   ⚠️  Skipped (already exists): {skipped_count}")
    print(f"   ❌ Failed: {failed_count}")
    print("=" * 60)

    if added_count > 0:
        print(f"\n🎉 Successfully added {added_count} albums from Spotify!")


def fetch_artist_discography(artist_name: str, genre: str, region: str, limit: int = 10):
    """
    Fetch all albums by a specific artist from Spotify

    Args:
        artist_name: Name of the artist
        genre: Genre to assign to albums
        region: Region to assign to albums
        limit: Maximum number of albums to fetch
    """
    db: Session = SessionLocal()

    print(f"\n🎸 Fetching discography for: {artist_name}")

    # Search for the artist
    artists = spotify_service.search_artist(artist_name, limit=1)

    if not artists:
        print(f"❌ Artist not found: {artist_name}")
        db.close()
        return

    artist_id = artists[0]['spotify_id']
    print(f"✅ Found artist: {artists[0]['name']}")

    # Get all albums by the artist
    albums = spotify_service.get_artist_albums(artist_id, limit=limit)

    added_count = 0
    for album_data in albums:
        # Check if album already exists
        existing = db.query(Album).filter(
            Album.title == album_data['title'],
            Album.artist == album_data['artist']
        ).first()

        if existing:
            print(f"⚠️  Already exists: {album_data['title']}")
            continue

        # Get full album details
        full_album = spotify_service.get_album_by_id(album_data['spotify_id'])

        if full_album:
            album = Album(
                title=full_album['title'],
                artist=full_album['artist'],
                year=full_album['year'],
                genre=genre,
                region=region,
                label=full_album.get('label', ''),
                cover_url=full_album['cover_url'],
                description=f"Spotify popularity: {full_album['popularity']}/100. Total tracks: {full_album['total_tracks']}."
            )

            db.add(album)
            db.commit()

            print(f"✅ Added: {album.title} ({album.year})")
            added_count += 1

    db.close()
    print(f"\n🎉 Added {added_count} albums by {artist_name}!")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Seed database with albums from Spotify')
    parser.add_argument('--artist', type=str, help='Fetch all albums by a specific artist')
    parser.add_argument('--genre', type=str, default='hip_hop', help='Genre for the albums')
    parser.add_argument('--region', type=str, default='east_coast', help='Region for the albums')
    parser.add_argument('--limit', type=int, default=10, help='Max number of albums to fetch per artist')

    args = parser.parse_args()

    try:
        if args.artist:
            # Fetch specific artist's discography
            fetch_artist_discography(args.artist, args.genre, args.region, args.limit)
        else:
            # Fetch predefined list of albums
            fetch_and_seed_albums()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n⚠️  Make sure you have:")
        print("1. Set up your Spotify credentials in .env file")
        print("2. Installed spotipy: pip install spotipy")
        print("\nTo get Spotify credentials:")
        print("1. Go to https://developer.spotify.com/dashboard")
        print("2. Create an app")
        print("3. Copy Client ID and Client Secret to your .env file")
