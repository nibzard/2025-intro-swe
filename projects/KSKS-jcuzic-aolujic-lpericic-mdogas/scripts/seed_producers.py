import sys
import os
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.producer import Producer
from app.core.spotify_service import SpotifyService

# All producer data from albums
ALBUM_PRODUCERS = """
DJ Premier, Pete Rock, Q-Tip, L.E.S.
Dr. Dre
Sean Combs, Easy Mo Bee
Organized Noize
Dr. Dre, Johnny J, Daz Dillinger
RZA
A Tribe Called Quest
Eric B.
Dr. Dre, Hit-Boy, Pharrell Williams
The Bomb Squad
Teo Macero, Irving Townsend
Bob Thiele
Nesuhi Ertegun
Teo Macero
Teo Macero
Teo Macero
David Rubinson, Herbie Hancock
Alfred Lion
Norman Granz
Teo Macero
Pink Floyd
Yes & Eddy Offord
King Crimson
John Burns & Genesis
Rush & Terry Brown
Yes & Eddy Offord
Bob Ezrin, David Gilmour, Roger Waters
King Crimson
Rush & Terry Brown
Ian Anderson & Terry Ellis
Greg Lake
Pink Floyd
David Hitchcock
Rush & Terry Brown
ELP & Greg Lake
Jimmy Page
George Martin
Fleetwood Mac, Ken Caillat, Richard Dashut
Robert John 'Mutt' Lange
Bill Szymczyk
The Who, Glyn Johns
Mike Clink
Bruce Springsteen, Jon Landau, Mike Appel
Daniel Lanois, Brian Eno
Tom Scholz, John Boylan
"""

# Known producer URLs (manual fallback for famous ones)
KNOWN_PRODUCER_INFO = {
    # Rock/Prog legends
    "George Martin": {
        "signature_sound": "Beatles' orchestral arrangements",
        "note": "The Fifth Beatle"
    },
    "Bob Ezrin": {
        "signature_sound": "Theatrical rock production",
        "note": "Pink Floyd The Wall producer"
    },
    "Brian Eno": {
        "signature_sound": "Ambient and experimental textures",
        "note": "Pioneer of ambient music"
    },
    "Daniel Lanois": {
        "signature_sound": "Atmospheric soundscapes",
        "note": "U2 and Dylan collaborator"
    },
    "Jimmy Page": {
        "signature_sound": "Layered guitar textures",
        "note": "Led Zeppelin guitarist/producer"
    },
    "Roger Waters": {
        "signature_sound": "Conceptual rock narratives",
        "note": "Pink Floyd bassist/songwriter"
    },
    
    # Jazz legends
    "Teo Macero": {
        "signature_sound": "Tape editing and jazz fusion",
        "note": "Miles Davis' longtime collaborator"
    },
    "Alfred Lion": {
        "signature_sound": "Blue Note hard bop",
        "note": "Blue Note Records founder"
    },
    "Bob Thiele": {
        "signature_sound": "Free jazz production",
        "note": "Impulse! Records producer"
    },
    "Norman Granz": {
        "signature_sound": "Live jazz recordings",
        "note": "Jazz at the Philharmonic founder"
    },
    
    # Hip-Hop legends (try Spotify first for these)
    "Dr. Dre": {
        "signature_sound": "G-Funk synthesizers and deep bass",
        "spotify_search": "Dr. Dre"
    },
    "DJ Premier": {
        "signature_sound": "Boom bap drums and scratching",
        "spotify_search": "DJ Premier"
    },
    "Pete Rock": {
        "signature_sound": "Jazz samples and soulful production",
        "spotify_search": "Pete Rock"
    },
    "Q-Tip": {
        "signature_sound": "Jazz-influenced abstract hip-hop",
        "spotify_search": "Q-Tip"
    },
    "RZA": {
        "signature_sound": "Gritty kung-fu samples and soul loops",
        "spotify_search": "RZA"
    },
    "Pharrell Williams": {
        "signature_sound": "Minimal beats and vocal layers",
        "spotify_search": "Pharrell Williams"
    },
    "Hit-Boy": {
        "signature_sound": "Orchestral and cinematic hip-hop",
        "spotify_search": "Hit-Boy"
    },
    "Sean Combs": {
        "signature_sound": "Sampling and Bad Boy sound",
        "spotify_search": "Diddy"
    },
    "The Bomb Squad": {
        "signature_sound": "Dense layers and political messaging",
        "spotify_search": "The Bomb Squad"
    },
}


def parse_producers(producer_string: str) -> list[str]:
    """Parse producer string into individual names"""
    # Replace separators with |
    for sep in [',', '&', ' and ']:
        producer_string = producer_string.replace(sep, '|')
    
    producers = [p.strip() for p in producer_string.split('|') if p.strip()]
    return producers


def extract_unique_producers():
    """Extract all unique producers from album data"""
    all_producers = set()
    
    for line in ALBUM_PRODUCERS.strip().split('\n'):
        producers = parse_producers(line)
        all_producers.update(producers)
    
    return sorted(all_producers)


def get_producer_image(spotify: SpotifyService, producer_name: str) -> tuple[str | None, str]:
    """
    Try to get producer image from Spotify
    
    Returns:
        Tuple of (image_url, source)
    """
    # Check if we have a custom Spotify search term
    if producer_name in KNOWN_PRODUCER_INFO:
        info = KNOWN_PRODUCER_INFO[producer_name]
        if 'spotify_search' in info:
            search_term = info['spotify_search']
            print(f"    🔍 Searching Spotify: '{search_term}'")
            try:
                image_url = spotify.get_artist_image(search_term)
                if image_url:
                    return image_url, "Spotify"
            except Exception as e:
                print(f"    ⚠️  Spotify error: {e}")
    
    # Try direct search
    try:
        image_url = spotify.get_artist_image(producer_name)
        if image_url:
            return image_url, "Spotify"
    except:
        pass
    
    return None, "Not found"


def seed_producers(db: Session, use_placeholders: bool = True):
    """
    Seed producers into database
    
    Args:
        db: Database session
        use_placeholders: If True, create producers even without images
    """
    print("🎛️  Starting producer seeding process...")
    
    # Initialize Spotify service
    try:
        spotify = SpotifyService()
        print("✅ Spotify service initialized\n")
    except Exception as e:
        print(f"❌ Failed to initialize Spotify: {e}")
        spotify = None
    
    # Get unique producers
    unique_producers = extract_unique_producers()
    print(f"📊 Found {len(unique_producers)} unique producers\n")
    
    created_count = 0
    skipped_count = 0
    with_images = 0
    without_images = 0
    
    for producer_name in unique_producers:
        # Check if producer already exists
        existing = db.query(Producer).filter(Producer.name == producer_name).first()
        
        if existing:
            print(f"⏭️  {producer_name} (already exists)")
            skipped_count += 1
            continue
        
        print(f"🔧 {producer_name}")
        
        # Get producer info
        signature_sound = None
        image_url = None
        source = "None"
        
        if producer_name in KNOWN_PRODUCER_INFO:
            info = KNOWN_PRODUCER_INFO[producer_name]
            signature_sound = info.get('signature_sound')
            note = info.get('note', '')
            if note:
                print(f"    📝 {note}")
        
        # Try to get image from Spotify
        if spotify:
            image_url, source = get_producer_image(spotify, producer_name)
            
            if image_url:
                print(f"    ✅ Image found via {source}")
                with_images += 1
            else:
                print(f"    ⚠️  No image found")
                without_images += 1
        
        # Create producer
        producer = Producer(
            name=producer_name,
            signature_sound=signature_sound,
            image_url=image_url
        )
        
        db.add(producer)
        created_count += 1
        print()
    
    # Commit all changes
    db.commit()
    
    print("="*70)
    print(f"🎉 Producer seeding complete!")
    print(f"✅ Created: {created_count}")
    print(f"⏭️  Skipped: {skipped_count}")
    print(f"🖼️  With images: {with_images}")
    print(f"❌ Without images: {without_images}")
    print(f"📊 Total: {created_count + skipped_count}")
    
    if without_images > 0:
        print(f"\n💡 {without_images} producers created without images")
        print("   You can add images later via update script or manually")
    
    print("="*70)


def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed producers into database')
    parser.add_argument('--no-placeholders', action='store_true',
                        help='Only create producers with images')
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        seed_producers(db, use_placeholders=not args.no_placeholders)
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()