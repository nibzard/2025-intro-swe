#!/usr/bin/env python3
"""
Example script demonstrating how to fetch data from Spotify API
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.spotify_service import spotify_service


def example_search_album():
    """Example: Search for an album"""
    print("\n=== Example 1: Search for Albums ===")
    query = "Kind of Blue Miles Davis"
    print(f"Searching for: {query}")

    albums = spotify_service.search_album(query, limit=3)

    for i, album in enumerate(albums, 1):
        print(f"\n{i}. {album['title']}")
        print(f"   Artist: {album['artist']}")
        print(f"   Year: {album['year']}")
        print(f"   Cover: {album['cover_url']}")
        print(f"   Spotify URL: {album['spotify_url']}")


def example_get_album_details():
    """Example: Get detailed album information"""
    print("\n=== Example 2: Get Album Details by ID ===")

    # First search for an album to get its ID
    albums = spotify_service.search_album("Illmatic Nas", limit=1)
    if albums:
        album_id = albums[0]['spotify_id']
        print(f"Found album ID: {album_id}")

        # Get full details
        album_details = spotify_service.get_album_by_id(album_id)

        print(f"\nTitle: {album_details['title']}")
        print(f"Artist: {album_details['artist']}")
        print(f"Year: {album_details['year']}")
        print(f"Label: {album_details['label']}")
        print(f"Total Tracks: {album_details['total_tracks']}")
        print(f"Popularity: {album_details['popularity']}")
        print(f"Cover URL: {album_details['cover_url']}")

        print("\nTrack List:")
        for track in album_details['tracks']:
            duration_min = track['duration_ms'] // 60000
            duration_sec = (track['duration_ms'] % 60000) // 1000
            print(f"  {track['track_number']}. {track['name']} ({duration_min}:{duration_sec:02d})")


def example_search_artist():
    """Example: Search for an artist"""
    print("\n=== Example 3: Search for Artists ===")
    query = "Miles Davis"
    print(f"Searching for: {query}")

    artists = spotify_service.search_artist(query, limit=3)

    for i, artist in enumerate(artists, 1):
        print(f"\n{i}. {artist['name']}")
        print(f"   Genres: {', '.join(artist['genres'])}")
        print(f"   Popularity: {artist['popularity']}")
        print(f"   Followers: {artist['followers']:,}")
        print(f"   Spotify URL: {artist['spotify_url']}")


def example_get_artist_albums():
    """Example: Get all albums by an artist"""
    print("\n=== Example 4: Get Artist's Albums ===")

    # First search for an artist
    artists = spotify_service.search_artist("Nas", limit=1)
    if artists:
        artist_id = artists[0]['spotify_id']
        print(f"Artist: {artists[0]['name']}")

        # Get their albums
        albums = spotify_service.get_artist_albums(artist_id, limit=10)

        print(f"\nFound {len(albums)} albums:\n")
        for i, album in enumerate(albums, 1):
            print(f"{i}. {album['title']} ({album['year']})")
            print(f"   Tracks: {album['total_tracks']}")


def example_find_specific_album():
    """Example: Find a specific album by name and artist"""
    print("\n=== Example 5: Find Specific Album ===")

    album_name = "The Dark Side of the Moon"
    artist_name = "Pink Floyd"
    print(f"Searching for: '{album_name}' by {artist_name}")

    album = spotify_service.get_album_by_name_and_artist(album_name, artist_name)

    if album:
        print(f"\nFound: {album['title']}")
        print(f"Artist: {album['artist']}")
        print(f"Year: {album['year']}")
        print(f"Label: {album['label']}")
        print(f"Cover: {album['cover_url']}")
        print(f"Total Tracks: {album['total_tracks']}")
    else:
        print("Album not found!")


def main():
    """Run all examples"""
    print("=" * 60)
    print("Spotify API Integration Examples")
    print("=" * 60)

    try:
        # Run examples
        example_search_album()
        example_get_album_details()
        example_search_artist()
        example_get_artist_albums()
        example_find_specific_album()

        print("\n" + "=" * 60)
        print("All examples completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure you have:")
        print("1. Installed spotipy: pip install spotipy")
        print("2. Set up your Spotify credentials in .env:")
        print("   SPOTIFY_CLIENT_ID=your-client-id")
        print("   SPOTIFY_CLIENT_SECRET=your-client-secret")
        print("\nTo get credentials:")
        print("1. Go to https://developer.spotify.com/dashboard")
        print("2. Create an app")
        print("3. Copy Client ID and Client Secret")


if __name__ == "__main__":
    main()
