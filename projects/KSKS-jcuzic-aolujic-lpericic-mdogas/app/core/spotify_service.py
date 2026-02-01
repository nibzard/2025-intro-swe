"""
Spotify API service for fetching album, artist, and track data
"""
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from typing import Optional, Dict, List, Any
from app.config import settings


class SpotifyService:
    """Service for interacting with the Spotify Web API"""

    def __init__(self):
        """Initialize Spotify client with credentials"""
        auth_manager = SpotifyClientCredentials(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET
        )
        self.sp = spotipy.Spotify(auth_manager=auth_manager)

    def search_album(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for albums on Spotify

        Args:
            query: Search query (e.g., "Kind of Blue Miles Davis")
            limit: Maximum number of results to return

        Returns:
            List of album dictionaries with simplified data
        """
        results = self.sp.search(q=query, type='album', limit=limit)
        albums = []

        for item in results['albums']['items']:
            albums.append({
                'spotify_id': item['id'],
                'title': item['name'],
                'artist': ', '.join([artist['name'] for artist in item['artists']]),
                'year': int(item['release_date'][:4]) if item['release_date'] else None,
                'cover_url': item['images'][0]['url'] if item['images'] else None,
                'spotify_url': item['external_urls']['spotify'],
                'label': item.get('label', None),
                'total_tracks': item['total_tracks']
            })

        return albums

    def get_album_by_id(self, album_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed album information by Spotify ID

        Args:
            album_id: Spotify album ID

        Returns:
            Dictionary with album details
        """
        try:
            album = self.sp.album(album_id)

            return {
                'spotify_id': album['id'],
                'title': album['name'],
                'artist': ', '.join([artist['name'] for artist in album['artists']]),
                'year': int(album['release_date'][:4]) if album['release_date'] else None,
                'cover_url': album['images'][0]['url'] if album['images'] else None,
                'spotify_url': album['external_urls']['spotify'],
                'label': album.get('label', None),
                'total_tracks': album['total_tracks'],
                'genres': album.get('genres', []),
                'popularity': album.get('popularity', 0),
                'release_date': album['release_date'],
                'tracks': [
                    {
                        'name': track['name'],
                        'track_number': track['track_number'],
                        'duration_ms': track['duration_ms'],
                        'spotify_url': track['external_urls']['spotify']
                    }
                    for track in album['tracks']['items']
                ]
            }
        except Exception as e:
            print(f"Error fetching album {album_id}: {e}")
            return None

    def search_artist(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for artists on Spotify

        Args:
            query: Artist name
            limit: Maximum number of results to return

        Returns:
            List of artist dictionaries
        """
        results = self.sp.search(q=query, type='artist', limit=limit)
        artists = []

        for item in results['artists']['items']:
            artists.append({
                'spotify_id': item['id'],
                'name': item['name'],
                'genres': item.get('genres', []),
                'popularity': item.get('popularity', 0),
                'image_url': item['images'][0]['url'] if item['images'] else None,
                'spotify_url': item['external_urls']['spotify'],
                'followers': item['followers']['total']
            })

        return artists

    def get_artist_by_id(self, artist_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed artist information by Spotify ID

        Args:
            artist_id: Spotify artist ID

        Returns:
            Dictionary with artist details
        """
        try:
            artist = self.sp.artist(artist_id)

            return {
                'spotify_id': artist['id'],
                'name': artist['name'],
                'genres': artist.get('genres', []),
                'popularity': artist.get('popularity', 0),
                'image_url': artist['images'][0]['url'] if artist['images'] else None,
                'spotify_url': artist['external_urls']['spotify'],
                'followers': artist['followers']['total']
            }
        except Exception as e:
            print(f"Error fetching artist {artist_id}: {e}")
            return None

    def get_artist_image(self, artist_name: str) -> Optional[str]:
        """
        Get artist image URL by searching for the artist
        
        Args:
            artist_name: Name of the artist to search for
            
        Returns:
            Image URL or None if not found
        """
        try:
            # Search for the artist
            artists = self.search_artist(artist_name, limit=1)
            
            if artists and artists[0]['image_url']:
                return artists[0]['image_url']
            
            return None
        except Exception as e:
            print(f"Error fetching image for artist {artist_name}: {e}")
            return None

    def get_artist_albums(self, artist_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all albums by an artist

        Args:
            artist_id: Spotify artist ID
            limit: Maximum number of albums to return

        Returns:
            List of album dictionaries
        """
        try:
            results = self.sp.artist_albums(artist_id, album_type='album', limit=limit)
            albums = []

            for item in results['items']:
                albums.append({
                    'spotify_id': item['id'],
                    'title': item['name'],
                    'artist': ', '.join([artist['name'] for artist in item['artists']]),
                    'year': int(item['release_date'][:4]) if item['release_date'] else None,
                    'cover_url': item['images'][0]['url'] if item['images'] else None,
                    'spotify_url': item['external_urls']['spotify'],
                    'total_tracks': item['total_tracks'],
                    'release_date': item['release_date']
                })

            return albums
        except Exception as e:
            print(f"Error fetching albums for artist {artist_id}: {e}")
            return []

    def get_album_by_name_and_artist(self, album_name: str, artist_name: str) -> Optional[Dict[str, Any]]:
        """
        Search for a specific album by name and artist

        Args:
            album_name: Album title
            artist_name: Artist name

        Returns:
            Album details dictionary or None if not found
        """
        query = f"album:{album_name} artist:{artist_name}"
        results = self.search_album(query, limit=1)

        if results:
            # Get full details for the first result
            return self.get_album_by_id(results[0]['spotify_id'])

        return None


# Create a singleton instance
spotify_service = SpotifyService()
