import sys
import os
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.artist import Artist
from app.core.spotify_service import SpotifyService

# Alternative search queries for problematic artists
ARTIST_SEARCH_ALTERNATIVES = {
    "Dr. Dre": ["Dr Dre", "Dre"],
    "2Pac": ["Tupac Shakur", "Tupac", "2pac"],
    "The Notorious B.I.G.": ["Notorious BIG", "Biggie Smalls", "Biggie"],
    "Wu-Tang Clan": ["Wu Tang Clan", "Wu Tang"],
    "OutKast": ["Outkast"],
    "Led Zeppelin": ["Led Zeppelin"],
    "The Beatles": ["Beatles"],
    "Pink Floyd": ["Pink Floyd"],
    "Yes": ["Yes band", "Yes rock"],
    "Rush": ["Rush band", "Rush rock"],
    "Nas": ["Nas rapper", "Nasir Jones"],
    "Snoop Dogg": ["Snoop Dogg", "Snoop"],
}


def get_artist_image_with_fallback(spotify: SpotifyService, artist_name: str) -> tuple[str | None, str]:
    """
    Try multiple search strategies to find artist image
    
    Returns:
        Tuple of (image_url, search_query_used)
    """
    # Try original name first
    try:
        results = spotify.search_artist(artist_name, limit=5)
        
        # Try exact match first
        for result in results:
            if result['name'].lower() == artist_name.lower():
                if result['image_url']:
                    return result['image_url'], result['name']
        
        # Try contains match
        for result in results:
            if artist_name.lower() in result['name'].lower() or result['name'].lower() in artist_name.lower():
                if result['image_url']:
                    return result['image_url'], result['name']
        
        # Just take first result if it has image
        if results and results[0]['image_url']:
            return results[0]['image_url'], results[0]['name']
            
    except Exception as e:
        print(f"    ❌ Error with original name: {e}")
    
    # Try alternatives if available
    if artist_name in ARTIST_SEARCH_ALTERNATIVES:
        for alt_name in ARTIST_SEARCH_ALTERNATIVES[artist_name]:
            print(f"    🔄 Trying alternative: '{alt_name}'")
            try:
                results = spotify.search_artist(alt_name, limit=5)
                
                # Look for best match
                for result in results:
                    if result['image_url']:
                        # Check if this is likely the right artist
                        if (artist_name.lower().replace("the ", "") in result['name'].lower() or
                            result['name'].lower() in artist_name.lower()):
                            return result['image_url'], result['name']
                
                # Take first result with image
                if results and results[0]['image_url']:
                    return results[0]['image_url'], results[0]['name']
                    
            except Exception as e:
                print(f"    ❌ Failed: {e}")
                continue
    
    return None, artist_name


def update_artist_images(db: Session, force_update: bool = False):
    """
    Update artist images from Spotify
    
    Args:
        db: Database session
        force_update: If True, update all artists. If False, only update those without images or placeholders
    """
    print("🎵 Starting artist image update process...")
    
    # Initialize Spotify service
    try:
        spotify = SpotifyService()
        print("✅ Spotify service initialized\n")
    except Exception as e:
        print(f"❌ Failed to initialize Spotify: {e}")
        return
    
    # Get artists to update
    if force_update:
        artists = db.query(Artist).all()
        print(f"📊 Updating ALL {len(artists)} artists")
    else:
        # Find artists without images OR with placeholder images
        artists = db.query(Artist).filter(
            (Artist.image_url == None) | 
            (Artist.image_url == "") |
            (Artist.image_url.like('%placeholder%'))
        ).all()
        print(f"📊 Found {len(artists)} artists without images or with placeholders")
    
    if not artists:
        print("✅ All artists already have images!")
        return
    
    print()
    
    updated_count = 0
    failed_count = 0
    failed_artists = []
    
    for artist in artists:
        print(f"🔍 Processing: {artist.name}")
        
        try:
            image_url, search_query = get_artist_image_with_fallback(spotify, artist.name)
            
            if image_url:
                artist.image_url = image_url
                updated_count += 1
                print(f"  ✅ Updated!")
                if search_query != artist.name:
                    print(f"  📝 Found via: '{search_query}'")
                print(f"  🖼️  {image_url[:70]}...")
            else:
                failed_count += 1
                failed_artists.append(artist.name)
                print(f"  ❌ No image found")
                
        except Exception as e:
            failed_count += 1
            failed_artists.append(artist.name)
            print(f"  ❌ Error: {e}")
        
        print()
    
    # Commit changes
    if updated_count > 0:
        db.commit()
        print(f"💾 Changes committed to database")
    
    # Summary
    print("="*70)
    print(f"🎉 Update complete!")
    print(f"✅ Updated: {updated_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"📊 Total processed: {len(artists)}")
    
    if failed_artists:
        print(f"\n⚠️  Failed to find images for:")
        for artist in failed_artists:
            print(f"   - {artist}")
        print("\n💡 You can:")
        print("   1. Run this script again (Spotify API can be flaky)")
        print("   2. Manually add image URLs via database")
        print("   3. Add more alternatives to ARTIST_SEARCH_ALTERNATIVES")
    
    print("="*70)


def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Update artist images from Spotify')
    parser.add_argument('--force', action='store_true', 
                        help='Force update all artists, even those with existing images')
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        update_artist_images(db, force_update=args.force)
    except Exception as e:
        print(f"❌ Error during update: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()