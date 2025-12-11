import sys
import os

# Dodaj parent direktorij u Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.album import Album

def seed_albums():
    db = SessionLocal()
    
    # Provjeri da li vec ima albuma
    existing = db.query(Album).first()
    if existing:
        print("❌ Baza vec ima albume. Preskačem seed.")
        db.close()
        return
    
    albums_data = [
    {
        "title": "Illmatic",
        "artist": "Nas",
        "year": 1994,
        "region": "east_coast",
        "producer": "DJ Premier, Pete Rock, Q-Tip, L.E.S.",
        "label": "Columbia Records",
        "cover_url": "images/Illmatic.jpg",
        "description": "Widely regarded as one of the greatest hip hop albums of all time. Nas' debut features intricate lyricism and production from legendary producers."
    },
    {
        "title": "Ready to Die",
        "artist": "The Notorious B.I.G.",
        "year": 1994,
        "region": "east_coast",
        "producer": "Easy Mo Bee, DJ Premier, Chucky Thompson",
        "label": "Bad Boy Records",
        "cover_url": "images/readytodie.jpg",
        "description": "Biggie's debut album that revolutionized East Coast hip hop with its cinematic storytelling and smooth delivery."
    },
    {
        "title": "The Chronic",
        "artist": "Dr. Dre",
        "year": 1992,
        "region": "west_coast",
        "producer": "Dr. Dre",
        "label": "Death Row Records",
        "cover_url": "images/chronic.jpg",
        "description": "G-funk masterpiece that defined West Coast sound. Introduced Snoop Dogg and featured funky basslines and P-Funk samples."
    },
    {
        "title": "Enter the Wu-Tang (36 Chambers)",
        "artist": "Wu-Tang Clan",
        "year": 1993,
        "region": "east_coast",
        "producer": "RZA",
        "label": "Loud Records",
        "cover_url": "images/wu.jpg",
        "description": "Raw, gritty debut from the 9-member collective. RZA's dusty soul samples and kung-fu movie clips created a unique sonic landscape."
    },
    {
        "title": "It Was Written",
        "artist": "Nas",
        "year": 1996,
        "region": "east_coast",
        "producer": "Trackmasters, DJ Premier, Dr. Dre, Havoc",
        "label": "Columbia Records",
        "cover_url": "images/nasit.jpg",
        "description": "Nas' sophomore album with more polished production. Featured the hit 'If I Ruled the World' with Lauryn Hill."
    },
    {
        "title": "Doggystyle",
        "artist": "Snoop Dogg",
        "year": 1993,
        "region": "west_coast",
        "producer": "Dr. Dre",
        "label": "Death Row Records",
        "cover_url": "images/snoop.jpg",
        "description": "Snoop's debut produced entirely by Dr. Dre. Smooth G-funk grooves with Snoop's laid-back flow became instant classics."
    },
    {
        "title": "All Eyez on Me",
        "artist": "2Pac",
        "year": 1996,
        "region": "west_coast",
        "producer": "Johnny J, Dr. Dre, Daz Dillinger",
        "label": "Death Row Records",
        "cover_url": "images/tupek.jpg",
        "description": "Double album released while 2Pac was at Death Row. Raw energy, party anthems, and introspective tracks showcasing his versatility."
    },
    {
        "title": "The Miseducation of Lauryn Hill",
        "artist": "Lauryn Hill",
        "year": 1998,
        "region": "east_coast",
        "producer": "Lauryn Hill, Rasheem Pugh, Vada Nobles",
        "label": "Ruffhouse Records",
        "cover_url": "images/lara.jpg",
        "description": "Blend of hip hop, R&B, and soul. Won 5 Grammys including Album of the Year. Featured 'Doo Wop (That Thing)' and 'Ex-Factor'."
    },
    {
        "title": "The Low End Theory",
        "artist": "A Tribe Called Quest",
        "year": 1991,
        "region": "east_coast",
        "producer": "A Tribe Called Quest",
        "label": "Jive Records",
        "cover_url": "images/tribe.jpg",
        "description": "Jazz-rap masterpiece with heavy basslines. Q-Tip and Phife Dawg's chemistry over innovative production redefined alternative hip hop."
    },
    {
        "title": "Paid in Full",
        "artist": "Eric B. & Rakim",
        "year": 1987,
        "region": "east_coast",
        "producer": "Eric B., Marley Marl",
        "label": "4th & B'way Records",
        "cover_url": "images/rakim.jpg",
        "description": "Revolutionary album that elevated MCing to new heights. Rakim's complex internal rhyme schemes influenced generations."
    },
    {
        "title": "AmeriKKKa's Most Wanted",
        "artist": "Ice Cube",
        "year": 1990,
        "region": "west_coast",
        "producer": "The Bomb Squad, Sir Jinx",
        "label": "Priority Records",
        "cover_url": "images/cube.jpg",
        "description": "Ice Cube's explosive solo debut after leaving N.W.A. Hard-hitting political commentary with Bomb Squad's dense production."
    },
    {
        "title": "The Blueprint",
        "artist": "Jay-Z",
        "year": 2001,
        "region": "east_coast",
        "producer": "Kanye West, Just Blaze, Timbaland",
        "label": "Roc-A-Fella Records",
        "cover_url": "images/jay.jpg",
        "description": "Released on 9/11/01. Soul-sampling production by Kanye West launched his career. Featured 'Izzo (H.O.V.A.)' and 'Takeover'."
    },
    {
        "title": "The Infamous",
        "artist": "Mobb Deep",
        "year": 1995,
        "region": "east_coast",
        "producer": "Havoc, Q-Tip",
        "label": "Loud Records",
        "cover_url": "images/mobb.jpg",
        "description": "Dark, haunting soundscapes depicting Queensbridge projects life. Havoc's minimalist production and Prodigy's vivid storytelling."
    },
    {
        "title": "Straight Outta Compton",
        "artist": "N.W.A",
        "year": 1988,
        "region": "west_coast",
        "producer": "Dr. Dre, DJ Yella",
        "label": "Ruthless Records",
        "cover_url": "images/nwa.jpg",
        "description": "Groundbreaking gangsta rap that brought West Coast to national attention. Raw, unfiltered social commentary and aggressive delivery."
    },
    {
        "title": "Reasonable Doubt",
        "artist": "Jay-Z",
        "year": 1996,
        "region": "east_coast",
        "producer": "DJ Premier, Ski, Clark Kent",
        "label": "Roc-A-Fella Records",
        "cover_url": "images/jayz.jpg",
        "description": "Jay-Z's debut showcasing mafioso rap style. Premium production and sophisticated wordplay established him as a force."
    },
    {
        "title": "Aquemini",
        "artist": "OutKast",
        "year": 1998,
        "region": "south",
        "producer": "Organized Noize, OutKast",
        "label": "LaFace Records",
        "cover_url": "images/outkast.jpg",
        "description": "Southern hip hop masterpiece blending funk, soul, and experimental sounds. 'Rosa Parks' and 'SpottieOttieDopaliscious' became classics."
    },
    {
        "title": "Black on Both Sides",
        "artist": "Mos Def",
        "year": 1999,
        "region": "east_coast",
        "producer": "DJ Premier, Ge-ology, Mr. Khaliyl",
        "label": "Rawkus Records",
        "cover_url": "images/mosdef.jpg",
        "description": "Conscious hip hop at its finest. Mos Def's versatile delivery over jazz-influenced beats. 'Ms. Fat Booty' and 'Mathematics'."
    },
    {
        "title": "Midnight Marauders",
        "artist": "A Tribe Called Quest",
        "year": 1993,
        "region": "east_coast",
        "producer": "A Tribe Called Quest",
        "label": "Jive Records",
        "cover_url": "images/tribecalled.jpg",
        "description": "Tribe's third album perfecting their jazz-rap sound. Smooth samples, clever wordplay, and universal themes about life and love."
    },
    {
        "title": "Liquid Swords",
        "artist": "GZA",
        "year": 1995,
        "region": "east_coast",
        "producer": "RZA",
        "label": "Geffen Records",
        "cover_url": "images/gza.jpg",
        "description": "GZA's solo masterpiece produced by RZA. Cold, cinematic soundscapes with chess metaphors and intricate wordplay throughout."
    },
    {
        "title": "Ridin' Dirty",
        "artist": "UGK",
        "year": 1996,
        "region": "south",
        "producer": "Pimp C",
        "label": "Jive Records",
        "cover_url": "images/ugk.jpg",
        "description": "Southern classic from Port Arthur, Texas duo. Pimp C's soulful production and Bun B's sharp lyrics defined Texas rap sound."
    }
]
    
    print("🎤 Dodajem klasične hip hop albume...")
    
    for album_data in albums_data:
        album = Album(**album_data)
        db.add(album)
        print(f"✅ Dodao: {album_data['artist']} - {album_data['title']} ({album_data['year']})")
    
    db.commit()
    print(f"\n🔥 Uspješno dodano {len(albums_data)} albuma!")
    db.close()

def seed_ratings():
    db = SessionLocal()
    
    # Provjeri da li vec ima ratinga
    from app.models.rating import Rating
    existing = db.query(Rating).first()
    if existing:
        print("❌ Baza vec ima ratinge. Preskačem seed.")
        db.close()
        return
    
    # Provjeri da li postoje useri
    from app.models.user import User
    users = db.query(User).all()
    if not users:
        print("⚠️  Nema usera! Kreiram test usera...")
        from app.core.security import get_password_hash
        
        test_users = [
            User(username="hiphopfan", email="fan@hiphop.com", hashed_password=get_password_hash("password123")),
            User(username="oldschool", email="oldschool@hiphop.com", hashed_password=get_password_hash("password123")),
            User(username="goldenage", email="golden@hiphop.com", hashed_password=get_password_hash("password123"))
        ]
        
        for user in test_users:
            db.add(user)
        db.commit()
        users = test_users
        print(f"✅ Kreirano {len(test_users)} test usera")
    
    # Dohvati albume
    albums = db.query(Album).all()
    if not albums:
        print("⚠️  Nema albuma! Pokreni prvo seed za albume.")
        db.close()
        return
    
    print("⭐ Dodajem ratinge...")
    
    # Ratings data - realistični ratinzi za klasike
    ratings_data = [
        # Illmatic (album_id: 1)
        (1, users[0].id, 5.0, "Absolute masterpiece. Nas' storytelling is unmatched."),
        (1, users[1].id, 5.0, "Best hip hop album ever made."),
        (1, users[2].id, 4.8, "Near perfect. Production and lyricism on another level."),
        
        # Ready to Die (album_id: 2)
        (2, users[0].id, 4.9, "Biggie's flow is legendary. RIP to the king."),
        (2, users[1].id, 5.0, "Revolutionary storytelling. Changed the game."),
        
        # The Chronic (album_id: 3)
        (3, users[0].id, 4.7, "G-funk at its finest. Dre's production is untouchable."),
        (3, users[2].id, 4.8, "Defined West Coast sound. Classic!"),
        
        # Wu-Tang 36 Chambers (album_id: 4)
        (4, users[1].id, 5.0, "Raw, gritty, perfect. RZA's production is genius."),
        (4, users[2].id, 4.9, "9 MCs, 1 masterpiece. Kung-fu samples are iconic."),
        
        # It Was Written (album_id: 5)
        (5, users[0].id, 4.3, "Solid follow-up to Illmatic. More commercial but still dope."),
        
        # Doggystyle (album_id: 6)
        (6, users[1].id, 4.6, "Snoop's laid-back flow over Dre beats. Perfection."),
        (6, users[2].id, 4.7, "G-funk masterclass. Who Am I is legendary."),
        
        # All Eyez on Me (album_id: 7)
        (7, users[0].id, 4.8, "2Pac's magnum opus. So much energy and emotion."),
        (7, users[1].id, 4.9, "Double album with no skips. RIP Pac."),
        
        # Miseducation of Lauryn Hill (album_id: 8)
        (8, users[2].id, 5.0, "Transcendent. Blend of hip hop and soul. Timeless."),
        (8, users[0].id, 4.9, "Lauryn Hill's genius on full display."),
        
        # Low End Theory (album_id: 9)
        (9, users[1].id, 4.8, "Jazz-rap perfection. Tribe elevated the art form."),
        (9, users[2].id, 4.7, "Smooth, intelligent, classic."),
        
        # Paid in Full (album_id: 10)
        (10, users[0].id, 4.9, "Rakim changed rap forever. Complex rhyme schemes."),
        
        # AmeriKKKa's Most Wanted (album_id: 11)
        (11, users[1].id, 4.5, "Ice Cube's solo debut is fire. Political and raw."),
        
        # The Blueprint (album_id: 12)
        (12, users[0].id, 4.6, "Kanye's soul samples + Jay's flow = classic."),
        (12, users[2].id, 4.7, "Released on 9/11. Historical and musical significance."),
        
        # The Infamous (album_id: 13)
        (13, users[1].id, 4.8, "Dark, haunting Queensbridge tales. Shook Ones Pt. II is iconic."),
        
        # Straight Outta Compton (album_id: 14)
        (14, users[0].id, 5.0, "Changed hip hop forever. Raw and revolutionary."),
        (14, users[2].id, 4.9, "Brought gangsta rap to the mainstream. Historic."),
        
        # Reasonable Doubt (album_id: 15)
        (15, users[1].id, 4.7, "Jay's debut is sophisticated street rap at its best."),
        
        # Aquemini (album_id: 16)
        (16, users[2].id, 4.8, "OutKast's experimental masterpiece. Rosa Parks!"),
        (16, users[0].id, 4.6, "Southern hip hop innovation. So creative."),
        
        # Black on Both Sides (album_id: 17)
        (17, users[1].id, 4.5, "Mos Def's conscious lyrics over jazzy production."),
        
        # Midnight Marauders (album_id: 18)
        (18, users[0].id, 4.7, "Tribe's consistency is amazing. Another classic."),
        
        # Liquid Swords (album_id: 19)
        (19, users[2].id, 4.9, "GZA + RZA = perfection. Cold, cinematic hip hop."),
        
        # Ridin' Dirty (album_id: 20)
        (20, users[1].id, 4.4, "UGK put Texas on the map. Southern classic.")
    ]
    
    from app.crud.rating import update_album_rating
    
    for album_id, user_id, rating_value, review in ratings_data:
        rating = Rating(
            album_id=album_id,
            user_id=user_id,
            rating=rating_value,
            review=review
        )
        db.add(rating)
        print(f"✅ Rating: Album {album_id} - {rating_value}/5 stars")
    
    db.commit()
    
    # Update album average ratings
    print("\n📊 Računam prosječne ocjene...")
    for album_id in range(1, 21):
        update_album_rating(db, album_id)
    
    print(f"\n🔥 Uspješno dodano {len(ratings_data)} ratinga!")
    db.close()


if __name__ == "__main__":
    print("🚀 Pokrećem seed script...\n")
    
    # Kreiraj tablice ako ne postoje
    Base.metadata.create_all(bind=engine)
    
    seed_albums()
    seed_ratings()
    
    print("\n✨ Seed završen! Pokreni server i provjeri /api/v1/albums")
