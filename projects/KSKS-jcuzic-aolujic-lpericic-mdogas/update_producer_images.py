import sys
import os
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.producer import Producer
from app.core.spotify_service import SpotifyService

# Known producer search alternatives
PRODUCER_SEARCH_ALTERNATIVES = {
    "Dr. Dre": ["Dr. Dre", "Dr Dre", "Dre"],
    "DJ Premier": ["DJ Premier", "Premo"],
    "Pete Rock": ["Pete Rock"],
    "Q-Tip": ["Q-Tip", "Q Tip", "Kamaal Ibn John Fareed"],
    "RZA": ["RZA", "The RZA", "Bobby Digital"],
    "George Martin": ["George Martin", "George Martin producer"],
    "Brian Eno": ["Brian Eno"],
    "Rick Rubin": ["Rick Rubin"],
}


def get_producer_image_with_fallback(spotify: SpotifyService, producer_name: str) -> tuple[str | None, str]:
    """
    Try multiple search strategies to find producer image
    
    Returns:
        Tuple of (image_url, search_query_used)
    """
    # Try original name first
    try:
        results = spotify.search_artist(producer_name, limit=5)
        
        # Try exact match first
        for result in results:
            if result['name'].lower() == producer_name.lower():
                if result['image_url']:
                    return result['image_url'], result['name']
        
        # Try contains match
        for result in results:
            if producer_name.lower() in result['name'].lower() or result['name'].lower() in producer_name.lower():
                if result['image_url']:
                    return result['image_url'], result['name']
        
        # Just take first result if it has image
        if results and results[0]['image_url']:
            return results[0]['image_url'], results[0]['name']
            
    except Exception as e:
        print(f"    ❌ Error with original name: {e}")
    
    # Try alternatives if available
    if producer_name in PRODUCER_SEARCH_ALTERNATIVES:
        for alt_name in PRODUCER_SEARCH_ALTERNATIVES[producer_name]:
            print(f"    🔄 Trying alternative: '{alt_name}'")
            try:
                results = spotify.search_artist(alt_name, limit=5)
                
                # Look for best match
                for result in results:
                    if result['image_url']:
                        return result['image_url'], result['name']
                    
            except Exception as e:
                print(f"    ❌ Failed: {e}")
                continue
    
    return None, producer_name


def update_producer_images(db: Session, force_update: bool = False):
    """
    Update producer images from Spotify
    
    Args:
        db: Database session
        force_update: If True, update all producers. If False, only update those without images or placeholders
    """
    print("🎛️  Starting producer image update process...")
    
    # Initialize Spotify service
    try:
        spotify = SpotifyService()
        print("✅ Spotify service initialized\n")
    except Exception as e:
        print(f"❌ Failed to initialize Spotify: {e}")
        return
    
    # Get producers to update
    if force_update:
        producers = db.query(Producer).all()
        print(f"📊 Updating ALL {len(producers)} producers")
    else:
        # Find producers without images OR with placeholder images
        producers = db.query(Producer).filter(
            (Producer.image_url == None) | 
            (Producer.image_url == "") |
            (Producer.image_url.like('%placeholder%'))
        ).all()
        print(f"📊 Found {len(producers)} producers without images or with placeholders")
    
    if not producers:
        print("✅ All producers already have images!")
        return
    
    print()
    
    updated_count = 0
    failed_count = 0
    failed_producers = []
    
    for producer in producers:
        print(f"🔍 Processing: {producer.name}")
        
        try:
            image_url, search_query = get_producer_image_with_fallback(spotify, producer.name)
            
            if image_url:
                producer.image_url = image_url
                updated_count += 1
                print(f"  ✅ Updated!")
                if search_query != producer.name:
                    print(f"  📝 Found via: '{search_query}'")
                print(f"  🖼️  {image_url[:70]}...")
            else:
                failed_count += 1
                failed_producers.append(producer.name)
                print(f"  ❌ No image found")
                
        except Exception as e:
            failed_count += 1
            failed_producers.append(producer.name)
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
    print(f"📊 Total processed: {len(producers)}")
    
    if failed_producers:
        print(f"\n⚠️  Failed to find images for:")
        for producer in failed_producers:
            print(f"   - {producer}")
        print("\n💡 You can:")
        print("   1. Run this script again (Spotify API can be flaky)")
        print("   2. Manually add image URLs via database")
        print("   3. Add more alternatives to PRODUCER_SEARCH_ALTERNATIVES")
    
    print("="*70)


def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Update producer images from Spotify')
    parser.add_argument('--force', action='store_true', 
                        help='Force update all producers, even those with existing images')
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        update_producer_images(db, force_update=args.force)
    except Exception as e:
        print(f"❌ Error during update: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()