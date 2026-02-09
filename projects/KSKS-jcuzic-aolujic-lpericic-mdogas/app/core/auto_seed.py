"""
Automatic seeding service - fetches albums from Spotify on startup
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.album import Album
from app.core.spotify_service import spotify_service
import logging
import random

logger = logging.getLogger(__name__)


# Define albums to auto-fetch organized by genre
AUTO_FETCH_ALBUMS = {
    "hip_hop": [
        ("Illmatic", "Nas", "east_coast"),
        ("The Chronic", "Dr. Dre", "west_coast"),
        ("Ready to Die", "The Notorious B.I.G.", "east_coast"),
        ("Enter the Wu-Tang (36 Chambers)", "Wu-Tang Clan", "east_coast"),
        ("All Eyez on Me", "2Pac", "west_coast"),
        ("The Miseducation of Lauryn Hill", "Lauryn Hill", "east_coast"),
        ("ATLiens", "Outkast", "south"),
        ("Aquemini", "Outkast", "south"),
        ("The Low End Theory", "A Tribe Called Quest", "east_coast"),
        ("Midnight Marauders", "A Tribe Called Quest", "east_coast"),
        ("Doggystyle", "Snoop Dogg", "west_coast"),
        ("The Blueprint", "Jay-Z", "east_coast"),
        ("The Black Album", "Jay-Z", "east_coast"),
        ("good kid, m.A.A.d city", "Kendrick Lamar", "west_coast"),
        ("To Pimp a Butterfly", "Kendrick Lamar", "west_coast"),
        ("The Eminem Show", "Eminem", "midwest"),
        ("The Marshall Mathers LP", "Eminem", "midwest"),
        ("Stankonia", "Outkast", "south"),
        ("36 Chambers", "Wu-Tang Clan", "east_coast"),
        ("Madvillainy", "Madvillain", "west_coast"),
        ("The College Dropout", "Kanye West", "midwest"),
        ("My Beautiful Dark Twisted Fantasy", "Kanye West", "midwest"),
        ("The Score", "Fugees", "east_coast"),
        ("Black Star", "Black Star", "east_coast"),
        ("The Infamous", "Mobb Deep", "east_coast"),
    ],
    "jazz": [
        ("Kind of Blue", "Miles Davis", "east_coast"),
        ("A Love Supreme", "John Coltrane", "east_coast"),
        ("Time Out", "Dave Brubeck", "west_coast"),
        ("Mingus Ah Um", "Charles Mingus", "east_coast"),
        ("Giant Steps", "John Coltrane", "east_coast"),
        ("Blue Train", "John Coltrane", "east_coast"),
        ("Head Hunters", "Herbie Hancock", "west_coast"),
        ("Bitches Brew", "Miles Davis", "east_coast"),
        ("Moanin'", "Art Blakey", "east_coast"),
        ("Song for My Father", "Horace Silver", "east_coast"),
        ("Sketches of Spain", "Miles Davis", "east_coast"),
        ("My Favorite Things", "John Coltrane", "east_coast"),
        ("The Black Saint and the Sinner Lady", "Charles Mingus", "east_coast"),
        ("Maiden Voyage", "Herbie Hancock", "west_coast"),
        ("Speak No Evil", "Wayne Shorter", "east_coast"),
    ],
    "classic_rock": [
        ("The Dark Side of the Moon", "Pink Floyd", "uk"),
        ("Led Zeppelin IV", "Led Zeppelin", "uk"),
        ("Abbey Road", "The Beatles", "uk"),
        ("Rumours", "Fleetwood Mac", "west_coast"),
        ("Hotel California", "Eagles", "west_coast"),
        ("Born to Run", "Bruce Springsteen", "east_coast"),
        ("Who's Next", "The Who", "uk"),
        ("Exile on Main St.", "The Rolling Stones", "uk"),
        ("Physical Graffiti", "Led Zeppelin", "uk"),
        ("Sticky Fingers", "The Rolling Stones", "uk"),
        ("Sgt. Pepper's Lonely Hearts Club Band", "The Beatles", "uk"),
        ("The White Album", "The Beatles", "uk"),
        ("Led Zeppelin II", "Led Zeppelin", "uk"),
        ("London Calling", "The Clash", "uk"),
        ("Born in the U.S.A.", "Bruce Springsteen", "east_coast"),
        ("Back in Black", "AC/DC", "australia"),
        ("Appetite for Destruction", "Guns N' Roses", "west_coast"),
        ("The Joshua Tree", "U2", "ireland"),
    ],
    "prog_rock": [
        ("Close to the Edge", "Yes", "uk"),
        ("In the Court of the Crimson King", "King Crimson", "uk"),
        ("The Wall", "Pink Floyd", "uk"),
        ("Selling England by the Pound", "Genesis", "uk"),
        ("Fragile", "Yes", "uk"),
        ("2112", "Rush", "canada"),
        ("Moving Pictures", "Rush", "canada"),
        ("Thick as a Brick", "Jethro Tull", "uk"),
        ("Brain Salad Surgery", "Emerson, Lake & Palmer", "uk"),
        ("Red", "King Crimson", "uk"),
        ("Hemispheres", "Rush", "canada"),
        ("The Lamb Lies Down on Broadway", "Genesis", "uk"),
        ("Tarkus", "Emerson, Lake & Palmer", "uk"),
        ("A Farewell to Kings", "Rush", "canada"),
        ("Octopus", "The Gentle Giant", "uk"),
    ],
    "rnb": [
        ("What's Going On", "Marvin Gaye", "detroit"),
        ("Songs in the Key of Life", "Stevie Wonder", "detroit"),
        ("Thriller", "Michael Jackson", "west_coast"),
        ("Off the Wall", "Michael Jackson", "west_coast"),
        ("Bad", "Michael Jackson", "west_coast"),
        ("Purple Rain", "Prince", "minneapolis"),
        ("Sign O' The Times", "Prince", "minneapolis"),
        ("The Velvet Rope", "Janet Jackson", "west_coast"),
        ("Control", "Janet Jackson", "west_coast"),
        ("CrazySexyCool", "TLC", "south"),
        ("Confessions", "Usher", "south"),
        ("The Emancipation of Mimi", "Mariah Carey", "east_coast"),
        ("Baduizm", "Erykah Badu", "south"),
        ("Voodoo", "D'Angelo", "south"),
        ("Channel Orange", "Frank Ocean", "west_coast"),
    ],
    "soul": [
        ("What's Going On", "Marvin Gaye", "detroit"),
        ("Let's Get It On", "Marvin Gaye", "detroit"),
        ("I Never Loved a Man the Way I Love You", "Aretha Franklin", "detroit"),
        ("Lady Soul", "Aretha Franklin", "detroit"),
        ("Otis Blue", "Otis Redding", "south"),
        ("Super Fly", "Curtis Mayfield", "chicago"),
        ("There's a Riot Goin' On", "Sly & The Family Stone", "west_coast"),
        ("Stand!", "Sly & The Family Stone", "west_coast"),
        ("Hot Buttered Soul", "Isaac Hayes", "south"),
        ("Dusty in Memphis", "Dusty Springfield", "south"),
    ],
    "funk": [
        ("Mothership Connection", "Parliament", "detroit"),
        ("One Nation Under a Groove", "Funkadelic", "detroit"),
        ("Maggot Brain", "Funkadelic", "detroit"),
        ("Songs in the Key of Life", "Stevie Wonder", "detroit"),
        ("Head Hunters", "Herbie Hancock", "west_coast"),
        ("There's a Riot Goin' On", "Sly & The Family Stone", "west_coast"),
        ("What's Going On", "Marvin Gaye", "detroit"),
        ("Super Fly", "Curtis Mayfield", "chicago"),
        ("Talking Book", "Stevie Wonder", "detroit"),
        ("3 Feet High and Rising", "De La Soul", "east_coast"),
    ],
    "blues": [
        ("Born Under a Bad Sign", "Albert King", "south"),
        ("Blues Breakers with Eric Clapton", "John Mayall", "uk"),
        ("Electric Ladyland", "The Jimi Hendrix Experience", "uk"),
        ("At Fillmore East", "The Allman Brothers Band", "south"),
        ("Layla and Other Assorted Love Songs", "Derek and the Dominos", "uk"),
        ("The Sky Is Crying", "Stevie Ray Vaughan", "south"),
        ("King of the Blues", "B.B. King", "south"),
        ("I Am the Blues", "Willie Dixon", "chicago"),
        ("Live at the Regal", "B.B. King", "south"),
        ("The Anthology", "Muddy Waters", "chicago"),
    ],
    "metal": [
        ("Master of Puppets", "Metallica", "west_coast"),
        ("The Number of the Beast", "Iron Maiden", "uk"),
        ("Paranoid", "Black Sabbath", "uk"),
        ("Reign in Blood", "Slayer", "west_coast"),
        ("Rust in Peace", "Megadeth", "west_coast"),
        ("Ride the Lightning", "Metallica", "west_coast"),
        ("Powerslave", "Iron Maiden", "uk"),
        ("Ace of Spades", "Motörhead", "uk"),
        ("Painkiller", "Judas Priest", "uk"),
        ("Among the Living", "Anthrax", "east_coast"),
        ("Vulgar Display of Power", "Pantera", "south"),
        ("The Black Album", "Metallica", "west_coast"),
    ],
    "electronic": [
        ("Selected Ambient Works 85-92", "Aphex Twin", "uk"),
        ("Music Has the Right to Children", "Boards of Canada", "uk"),
        ("Homework", "Daft Punk", "france"),
        ("Discovery", "Daft Punk", "france"),
        ("Dummy", "Portishead", "uk"),
        ("Mezzanine", "Massive Attack", "uk"),
        ("Blue Lines", "Massive Attack", "uk"),
        ("The Fat of the Land", "The Prodigy", "uk"),
        ("Play", "Moby", "east_coast"),
        ("Since I Left You", "The Avalanches", "australia"),
        ("Cross", "Justice", "france"),
        ("Random Access Memories", "Daft Punk", "france"),
    ],
}


def auto_fetch_albums():
    """
    Automatically fetch albums from Spotify if database is empty or needs more data
    This runs when the server starts up
    """
    db: Session = SessionLocal()

    try:
        # Check how many albums we have
        album_count = db.query(Album).count()

        logger.info(f"🎵 Current database has {album_count} albums")

        # Target: Keep database between 100-120 albums with random rotation
        TARGET_ALBUMS = 100

        if album_count < TARGET_ALBUMS:
            logger.info(f"📥 Auto-fetching albums from Spotify (target: {TARGET_ALBUMS})...")

            added_count = 0

            # Collect all available albums into a single list
            all_albums = []
            for genre, albums in AUTO_FETCH_ALBUMS.items():
                for album_name, artist_name, region in albums:
                    all_albums.append((genre, album_name, artist_name, region))

            # Shuffle for random selection
            random.shuffle(all_albums)

            total_available = len(all_albums)
            albums_needed = TARGET_ALBUMS - album_count

            logger.info(f"🔍 {total_available} albums available, attempting to add {albums_needed} more...")

            # Fetch albums until we reach target
            for genre, album_name, artist_name, region in all_albums:
                if added_count >= albums_needed:
                    break

                # Check if album already exists
                existing = db.query(Album).filter(
                    Album.title == album_name,
                    Album.artist == artist_name
                ).first()

                if existing:
                    continue

                try:
                    # Fetch from Spotify
                    album_data = spotify_service.get_album_by_name_and_artist(album_name, artist_name)

                    if album_data:
                        album = Album(
                            title=album_data['title'],
                            artist=album_data['artist'],
                            year=album_data['year'],
                            genre=genre,
                            region=region,
                            label=album_data.get('label', ''),
                            cover_url=album_data['cover_url'],
                            description=f"Spotify popularity: {album_data['popularity']}/100. {album_data['total_tracks']} tracks."
                        )

                        db.add(album)
                        db.commit()
                        added_count += 1
                        logger.info(f"✅ Added ({added_count}/{albums_needed}): {album.artist} - {album.title}")

                except Exception as e:
                    logger.warning(f"⚠️  Could not fetch {album_name}: {e}")
                    continue

            logger.info(f"🎉 Auto-fetch complete! Added {added_count} new albums (Total: {album_count + added_count})")

        else:
            logger.info(f"✅ Database has {album_count} albums (target: {TARGET_ALBUMS}), skipping auto-fetch")

    except Exception as e:
        logger.error(f"❌ Error in auto-fetch: {e}")

    finally:
        db.close()


def fetch_albums_for_genre(genre: str, limit: int = 5):
    """
    Fetch additional albums for a specific genre

    Args:
        genre: Genre name (hip_hop, jazz, classic_rock, prog_rock)
        limit: Number of albums to fetch
    """
    db: Session = SessionLocal()

    try:
        if genre not in AUTO_FETCH_ALBUMS:
            logger.error(f"Unknown genre: {genre}")
            return

        albums_to_fetch = AUTO_FETCH_ALBUMS[genre][:limit]
        added_count = 0

        for album_name, artist_name, region in albums_to_fetch:
            existing = db.query(Album).filter(
                Album.title == album_name,
                Album.artist == artist_name
            ).first()

            if existing:
                continue

            try:
                album_data = spotify_service.get_album_by_name_and_artist(album_name, artist_name)

                if album_data:
                    album = Album(
                        title=album_data['title'],
                        artist=album_data['artist'],
                        year=album_data['year'],
                        genre=genre,
                        region=region,
                        label=album_data.get('label', ''),
                        cover_url=album_data['cover_url'],
                        description=f"Spotify popularity: {album_data['popularity']}/100. {album_data['total_tracks']} tracks."
                    )

                    db.add(album)
                    db.commit()
                    added_count += 1
                    logger.info(f"✅ Added {genre}: {album.artist} - {album.title}")

            except Exception as e:
                logger.warning(f"⚠️  Could not fetch {album_name}: {e}")
                continue

        logger.info(f"✅ Fetched {added_count} albums for genre: {genre}")
        return added_count

    finally:
        db.close()
