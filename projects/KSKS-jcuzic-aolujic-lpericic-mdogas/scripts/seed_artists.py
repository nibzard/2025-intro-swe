import sys
import os
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models.artist import Artist
from app.models.album import Album
from app.models.producer import Producer
from app.core.spotify_service import SpotifyService

# All your albums data
classic_rock_albums = [
    {"title": "Led Zeppelin IV", "artist": "Led Zeppelin", "year": 1971, "genre": "classic_rock", "region": "uk"},
    {"title": "Abbey Road", "artist": "The Beatles", "year": 1969, "genre": "classic_rock", "region": "uk"},
    {"title": "Rumours", "artist": "Fleetwood Mac", "year": 1977, "genre": "classic_rock", "region": "uk"},
    {"title": "Back in Black", "artist": "AC/DC", "year": 1980, "genre": "classic_rock", "region": "australia"},
    {"title": "Hotel California", "artist": "Eagles", "year": 1976, "genre": "classic_rock", "region": "west_coast"},
    {"title": "The Who - Who's Next", "artist": "The Who", "year": 1971, "genre": "classic_rock", "region": "uk"},
    {"title": "Appetite for Destruction", "artist": "Guns N' Roses", "year": 1987, "genre": "classic_rock", "region": "west_coast"},
    {"title": "Born to Run", "artist": "Bruce Springsteen", "year": 1975, "genre": "classic_rock", "region": "east_coast"},
    {"title": "The Joshua Tree", "artist": "U2", "year": 1987, "genre": "classic_rock", "region": "ireland"},
    {"title": "Boston", "artist": "Boston", "year": 1976, "genre": "classic_rock", "region": "east_coast"},
]

hip_hop_albums = [
    {"title": "Illmatic", "artist": "Nas", "year": 1994, "genre": "hip_hop", "region": "east_coast"},
    {"title": "The Chronic", "artist": "Dr. Dre", "year": 1992, "genre": "hip_hop", "region": "west_coast"},
    {"title": "Ready to Die", "artist": "The Notorious B.I.G.", "year": 1994, "genre": "hip_hop", "region": "east_coast"},
    {"title": "ATLiens", "artist": "OutKast", "year": 1996, "genre": "hip_hop", "region": "south"},
    {"title": "All Eyez on Me", "artist": "2Pac", "year": 1996, "genre": "hip_hop", "region": "west_coast"},
    {"title": "Enter the Wu-Tang (36 Chambers)", "artist": "Wu-Tang Clan", "year": 1993, "genre": "hip_hop", "region": "east_coast"},
    {"title": "The Low End Theory", "artist": "A Tribe Called Quest", "year": 1991, "genre": "hip_hop", "region": "east_coast"},
    {"title": "Paid in Full", "artist": "Eric B. & Rakim", "year": 1987, "genre": "hip_hop", "region": "east_coast"},
    {"title": "Good Kid, M.A.A.D City", "artist": "Kendrick Lamar", "year": 2012, "genre": "hip_hop", "region": "west_coast"},
    {"title": "It Takes a Nation of Millions to Hold Us Back", "artist": "Public Enemy", "year": 1988, "genre": "hip_hop", "region": "east_coast"},
]

jazz_albums = [
    {"title": "Kind of Blue", "artist": "Miles Davis", "year": 1959, "genre": "jazz", "region": "east_coast"},
    {"title": "A Love Supreme", "artist": "John Coltrane", "year": 1965, "genre": "jazz", "region": "east_coast"},
    {"title": "Giant Steps", "artist": "John Coltrane", "year": 1960, "genre": "jazz", "region": "east_coast"},
    {"title": "Time Out", "artist": "The Dave Brubeck Quartet", "year": 1959, "genre": "jazz", "region": "west_coast"},
    {"title": "Mingus Ah Um", "artist": "Charles Mingus", "year": 1959, "genre": "jazz", "region": "east_coast"},
    {"title": "The Black Saint and the Sinner Lady", "artist": "Charles Mingus", "year": 1963, "genre": "jazz", "region": "east_coast"},
    {"title": "Head Hunters", "artist": "Herbie Hancock", "year": 1973, "genre": "jazz", "region": "west_coast"},
    {"title": "Blue Train", "artist": "John Coltrane", "year": 1958, "genre": "jazz", "region": "east_coast"},
    {"title": "Ella & Louis", "artist": "Ella Fitzgerald & Louis Armstrong", "year": 1956, "genre": "jazz", "region": "west_coast"},
    {"title": "Bitches Brew", "artist": "Miles Davis", "year": 1970, "genre": "jazz", "region": "east_coast"},
]

prog_rock_albums = [
    {"title": "The Dark Side of the Moon", "artist": "Pink Floyd", "year": 1973, "genre": "prog_rock", "region": "uk"},
    {"title": "Close to the Edge", "artist": "Yes", "year": 1972, "genre": "prog_rock", "region": "uk"},
    {"title": "In the Court of the Crimson King", "artist": "King Crimson", "year": 1969, "genre": "prog_rock", "region": "uk"},
    {"title": "Selling England by the Pound", "artist": "Genesis", "year": 1973, "genre": "prog_rock", "region": "uk"},
    {"title": "2112", "artist": "Rush", "year": 1976, "genre": "prog_rock", "region": "canada"},
    {"title": "Fragile", "artist": "Yes", "year": 1971, "genre": "prog_rock", "region": "uk"},
    {"title": "The Wall", "artist": "Pink Floyd", "year": 1979, "genre": "prog_rock", "region": "uk"},
    {"title": "Red", "artist": "King Crimson", "year": 1974, "genre": "prog_rock", "region": "uk"},
    {"title": "A Farewell to Kings", "artist": "Rush", "year": 1977, "genre": "prog_rock", "region": "canada"},
    {"title": "Thick as a Brick", "artist": "Jethro Tull", "year": 1972, "genre": "prog_rock", "region": "uk"},
    {"title": "Emerson, Lake & Palmer", "artist": "Emerson, Lake & Palmer", "year": 1970, "genre": "prog_rock", "region": "uk"},
    {"title": "Wish You Were Here", "artist": "Pink Floyd", "year": 1975, "genre": "prog_rock", "region": "uk"},
    {"title": "Foxtrot", "artist": "Genesis", "year": 1972, "genre": "prog_rock", "region": "uk"},
    {"title": "Moving Pictures", "artist": "Rush", "year": 1981, "genre": "prog_rock", "region": "canada"},
    {"title": "Brain Salad Surgery", "artist": "Emerson, Lake & Palmer", "year": 1973, "genre": "prog_rock", "region": "uk"},
]

ALL_ALBUMS = classic_rock_albums + hip_hop_albums + jazz_albums + prog_rock_albums

# Artist name mapping for Spotify search
# Maps your artist names to Spotify's exact artist names
ARTIST_NAME_MAPPING = {
    "Dr. Dre": "Dr. Dre",  # Try with period
    "2Pac": "2Pac",  # Try exact match first
    "The Notorious B.I.G.": "The Notorious B.I.G.",
    "OutKast": "OutKast",
    "Wu-Tang Clan": "Wu-Tang Clan",
    "Nas": "Nas",
    "Pink Floyd": "Pink Floyd",
    "Led Zeppelin": "Led Zeppelin",
    "The Beatles": "The Beatles",
    "Yes": "Yes",
    "Rush": "Rush",
    "Snoop Dogg": "Snoop Dogg",
}

# Alternative search queries if first search fails
ARTIST_SEARCH_ALTERNATIVES = {
    "Dr. Dre": ["Dr Dre", "Dre"],
    "2Pac": ["Tupac Shakur", "Tupac", "2pac"],
    "The Notorious B.I.G.": ["Notorious BIG", "Biggie Smalls", "Biggie"],
    "Wu-Tang Clan": ["Wu Tang Clan", "Wu Tang"],
    "OutKast": ["Outkast"],
}


def get_era_from_year(year: int) -> str:
    """Determine era based on year"""
    if year < 1970:
        return "1960s"
    elif year < 1980:
        return "1970s"
    elif year < 1990:
        return "1980s"
    elif year < 2000:
        return "1990s"
    elif year < 2010:
        return "2000s"
    else:
        return "2010s"


def extract_unique_artists():
    """Extract unique artists from all albums with their metadata"""
    artists_dict = {}
    
    for album in ALL_ALBUMS:
        artist_name = album["artist"]
        
        if artist_name not in artists_dict:
            artists_dict[artist_name] = {
                "name": artist_name,
                "region": album["region"],
                "genre": album["genre"],
                "era": get_era_from_year(album["year"]),
                "year": album["year"]  # Keep for reference
            }
    
    return list(artists_dict.values())


def get_artist_image_with_fallback(spotify: SpotifyService, artist_name: str) -> tuple[str | None, str]:
    """
    Try multiple search strategies to find artist image
    
    Returns:
        Tuple of (image_url, search_query_used)
    """
    # Try original name first
    search_name = ARTIST_NAME_MAPPING.get(artist_name, artist_name)
    image_url = spotify.get_artist_image(search_name)
    
    if image_url:
        return image_url, search_name
    
    # Try alternatives if available
    if artist_name in ARTIST_SEARCH_ALTERNATIVES:
        for alt_name in ARTIST_SEARCH_ALTERNATIVES[artist_name]:
            print(f"  🔄 Trying alternative: '{alt_name}'")
            image_url = spotify.get_artist_image(alt_name)
            if image_url:
                return image_url, alt_name
    
    # Try searching with album name for better matching
    # This helps with "The Beatles", "Led Zeppelin", etc.
    for album in ALL_ALBUMS:
        if album["artist"] == artist_name:
            query = f"{artist_name} {album['title']}"
            print(f"  🔄 Trying with album: '{query}'")
            try:
                results = spotify.search_artist(artist_name, limit=3)
                if results:
                    # Try to find best match
                    for result in results:
                        if artist_name.lower() in result['name'].lower():
                            return result['image_url'], result['name']
                    # Just take first result if no exact match
                    if results[0]['image_url']:
                        return results[0]['image_url'], results[0]['name']
            except:
                pass
            break
    
    return None, artist_name


def seed_artists(db: Session):
    """Seed artists into database with Spotify images"""
    print("🎵 Starting artist seeding process...")
    
    # Initialize Spotify service
    try:
        spotify = SpotifyService()
        print("✅ Spotify service initialized")
    except Exception as e:
        print(f"❌ Failed to initialize Spotify: {e}")
        print("⚠️  Continuing without Spotify images...")
        spotify = None
    
    # Extract unique artists
    unique_artists = extract_unique_artists()
    print(f"📊 Found {len(unique_artists)} unique artists")
    print()
    
    created_count = 0
    skipped_count = 0
    missing_images = []
    
    for artist_data in unique_artists:
        artist_name = artist_data["name"]
        
        # Check if artist already exists
        existing = db.query(Artist).filter(Artist.name == artist_name).first()
        
        if existing:
            print(f"⏭️  Skipping {artist_name} (already exists)")
            skipped_count += 1
            continue
        
        # Get Spotify image with fallback strategies
        image_url = None
        search_query = artist_name
        
        if spotify:
            try:
                image_url, search_query = get_artist_image_with_fallback(spotify, artist_name)
                
                if image_url:
                    print(f"✅ {artist_name}")
                    if search_query != artist_name:
                        print(f"   📝 Found via: '{search_query}'")
                    print(f"   🖼️  Image: {image_url[:60]}...")
                else:
                    print(f"❌ {artist_name} - No image found")
                    missing_images.append(artist_name)
                    
            except Exception as e:
                print(f"❌ {artist_name} - Error: {e}")
                missing_images.append(artist_name)
        
        # Create artist
        artist = Artist(
            name=artist_name,
            region=artist_data["region"],
            era=artist_data["era"],
            genre=artist_data["genre"],
            image_url=image_url,
            influence_score=0.0
        )
        
        db.add(artist)
        created_count += 1
        print()
    
    # Commit all changes
    db.commit()
    
    print("="*60)
    print(f"🎉 Artist seeding complete!")
    print(f"✅ Created: {created_count}")
    print(f"⏭️  Skipped: {skipped_count}")
    print(f"📊 Total: {created_count + skipped_count}")
    
    if missing_images:
        print(f"\n⚠️  Missing images ({len(missing_images)}):")
        for artist in missing_images:
            print(f"   - {artist}")
        print("\n💡 You can manually add these images later via update script")
    
    print("="*60)


def main():
    """Main execution function"""
    db = SessionLocal()
    
    try:
        seed_artists(db)
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()