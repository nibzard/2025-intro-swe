#!/usr/bin/env python3
"""
Update all album covers with Spotify URLs
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.album import Album
from app.core.spotify_service import spotify_service

# Create tables
Base.metadata.create_all(bind=engine)


def update_all_covers():
    """Update all albums with Spotify cover URLs"""
    db: Session = SessionLocal()

    try:
        # Get all albums
        albums = db.query(Album).all()

        print(f"🎵 Found {len(albums)} albums in database")
        print("🔄 Updating cover URLs from Spotify...\n")

        updated_count = 0
        failed_count = 0

        for album in albums:
            # Skip if already has a Spotify URL
            if album.cover_url and album.cover_url.startswith('https://i.scdn.co'):
                print(f"✓ Already has Spotify cover: {album.artist} - {album.title}")
                continue

            print(f"🔍 Fetching cover for: {album.artist} - {album.title}...")

            try:
                # Search for album on Spotify
                spotify_album = spotify_service.get_album_by_name_and_artist(
                    album.title,
                    album.artist
                )

                if spotify_album and spotify_album['cover_url']:
                    # Update the cover URL
                    album.cover_url = spotify_album['cover_url']

                    # Also update label if not set
                    if not album.label and spotify_album.get('label'):
                        album.label = spotify_album['label']

                    db.commit()

                    print(f"✅ Updated: {album.artist} - {album.title}")
                    print(f"   Cover: {spotify_album['cover_url'][:60]}...\n")
                    updated_count += 1
                else:
                    print(f"⚠️  No Spotify data found for: {album.artist} - {album.title}\n")
                    failed_count += 1

            except Exception as e:
                print(f"❌ Error updating {album.artist} - {album.title}: {e}\n")
                failed_count += 1
                continue

        print("=" * 70)
        print("📊 Summary:")
        print(f"   ✅ Updated: {updated_count}")
        print(f"   ⚠️  Failed: {failed_count}")
        print(f"   ✓  Already had Spotify covers: {len(albums) - updated_count - failed_count}")
        print("=" * 70)

        if updated_count > 0:
            print(f"\n🎉 Successfully updated {updated_count} album covers!")
            print("Refresh your browser to see the new covers!")

    finally:
        db.close()


if __name__ == "__main__":
    print("🎨 Album Cover Updater - Fetching covers from Spotify")
    print("=" * 70)

    try:
        update_all_covers()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n⚠️  Make sure:")
        print("1. Your Spotify credentials are set in .env file")
        print("2. spotipy is installed: pip install spotipy")
