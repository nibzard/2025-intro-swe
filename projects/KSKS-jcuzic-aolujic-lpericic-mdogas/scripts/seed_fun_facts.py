import sys
import os
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.artist import Artist
from app.models.producer import Producer
from app.core.wikipedia_service import WikipediaService

# ============================================================================
# ARTIST FUN FACTS DATABASE
# ============================================================================

ARTIST_FUN_FACTS = {
    # Classic Rock
    "Fleetwood Mac": {
        "biography": "British-American rock band that became pop superstars in the 1970s.",
        "fun_facts": "Rumours was recorded during band's romantic breakups. Stevie Nicks and Lindsey Buckingham fought daily in studio."
    },
    "AC/DC": {
        "biography": "Australian hard rock legends known for high-voltage performances.",
        "fun_facts": "Angus Young's schoolboy outfit was sister's idea. Back in Black sold 50 million copies worldwide."
    },
    "Eagles": {
        "biography": "California country-rock band that dominated 70s radio.",
        "fun_facts": "Hotel California guitar solo took 8 different attempts. Band broke up in 1980, reunited in 1994 saying 'Hell Freezes Over'."
    },
    "The Who": {
        "biography": "British rock pioneers known for smashing instruments and rock operas.",
        "fun_facts": "Keith Moon destroyed 1000+ drum kits. Pete Townshend invented 'power chord' windmill technique."
    },
    "Guns N' Roses": {
        "biography": "LA hard rock band that brought danger back to rock in late 80s.",
        "fun_facts": "Appetite for Destruction took 12 months to reach #1. Slash recorded solo for Sweet Child O' Mine in one take."
    },
    "Bruce Springsteen": {
        "biography": "The Boss, working-class hero from New Jersey.",
        "fun_facts": "Born to Run album almost destroyed him - took 14 months, 6 months mixing title track alone. Plays 4-hour concerts at age 70+."
    },
    "U2": {
        "biography": "Irish rock band that became biggest arena act in world.",
        "fun_facts": "Bono got nickname from hearing aid shop. The Edge uses 50+ guitar effects pedals live."
    },
    "Boston": {
        "biography": "Rock band built around MIT-trained engineer Tom Scholz.",
        "fun_facts": "Debut album mostly recorded in Tom Scholz's basement studio. He invented Rockman headphone amp used by millions."
    },
    
    # Hip-Hop
    "A Tribe Called Quest": {
        "biography": "Pioneering jazz-rap group from Queens, NY.",
        "fun_facts": "Named after line in jungle movie. Q-Tip and Phife Dawg were childhood friends who met at age 2."
    },
    "Eric B. & Rakim": {
        "biography": "DJ-MC duo that revolutionized hip hop in late 80s.",
        "fun_facts": "Rakim invented internal rhyme schemes. Never performed together after 1992 until 2017 reunion."
    },
    "Kendrick Lamar": {
        "biography": "Compton rapper who brought literary depth to modern hip hop.",
        "fun_facts": "To Pimp a Butterfly recorded in 3 weeks. Won Pulitzer Prize for DAMN - first non-classical/jazz artist ever."
    },
    "Public Enemy": {
        "biography": "Revolutionary hip hop group that brought Black power to mainstream.",
        "fun_facts": "Flavor Flav's clock necklace means 'know what time it is'. Chuck D's voice is deeper on records - RZA pitched it down."
    },
    
    # Jazz
    "Miles Davis": {
        "biography": "Jazz trumpet legend who revolutionized genre 5 times.",
        "fun_facts": "Played with back to audience. Kind of Blue recorded in 2 takes with no rehearsal. Changed jazz every decade for 40 years."
    },
    "John Coltrane": {
        "biography": "Saxophone virtuoso and spiritual jazz pioneer.",
        "fun_facts": "Practiced 10+ hours daily. A Love Supreme written after religious awakening. Sheets of Sound technique - 300 notes per minute."
    },
    "The Dave Brubeck Quartet": {
        "biography": "West Coast jazz group known for unusual time signatures.",
        "fun_facts": "Take Five in 5/4 time - first jazz single to sell million copies. Brubeck studied with classical composer Darius Milhaud."
    },
    "Charles Mingus": {
        "biography": "Bass virtuoso, composer, and volatile genius.",
        "fun_facts": "Punched Jimmy Knepper, broke his teeth. Fired his entire band mid-concert. Composed over 300 pieces."
    },
    "Herbie Hancock": {
        "biography": "Jazz pianist who embraced funk and electronic music.",
        "fun_facts": "Rockit won 5 Grammys - used turntables as instrument. Child prodigy played Mozart at 11 with Chicago Symphony."
    },
    "Ella Fitzgerald & Louis Armstrong": {
        "biography": "Jazz royalty - the First Lady and Ambassador of jazz.",
        "fun_facts": "Ella had 3-octave range. Louis invented scat singing when he dropped his sheet music mid-recording."
    },
    
    # Prog Rock
    "King Crimson": {
        "biography": "British prog rock pioneers with constantly changing lineup.",
        "fun_facts": "First album cover called 'disturbing' - banned in some stores. Robert Fripp only guitarist in all lineups."
    },
    "Genesis": {
        "biography": "British prog band that evolved from art rock to pop.",
        "fun_facts": "Peter Gabriel wore 900 different costumes on stage. Phil Collins joined as drummer, became singer by accident."
    },
    "Jethro Tull": {
        "biography": "Prog rock band built around flute-playing frontman Ian Anderson.",
        "fun_facts": "Named after 18th century seed drill inventor. Beat Metallica for Best Hard Rock Grammy in 1989 - controversial win."
    },
    "Emerson, Lake & Palmer": {
        "biography": "Prog rock supergroup known for keyboard wizardry.",
        "fun_facts": "Keith Emerson's Moog synthesizer cost more than house. Once toured with 36 tons of equipment."
    },
}

# ============================================================================
# PRODUCER FUN FACTS & TECHNIQUES DATABASE
# ============================================================================

PRODUCER_DATA = {
    # Hip-Hop Producers
    "Easy Mo Bee": {
        "biography": "Brooklyn producer behind Biggie's biggest hits.",
        "fun_facts": "Discovered by Heavy D. Made 'Flava in Ya Ear' remix with 5 rappers in one night.",
        "production_techniques": "SP-1200 drum machine, soul samples, hard-hitting kicks, Brooklyn grit.",
        "notable_albums": "Biggie - Ready to Die (Big Poppa, Gimme the Loot), 2Pac - Runnin"
    },
    "Sean Combs": {
        "biography": "Bad Boy Records founder, producer turned mogul.",
        "fun_facts": "Started as intern at Uptown Records. Built $900M empire. Known for dancing in every music video.",
        "production_techniques": "Heavy sampling, uplifting R&B hooks, shiny production, pop sensibility.",
        "notable_albums": "Biggie - Ready to Die (Juicy), Mase - Harlem World, Mary J. Blige - My Life"
    },
    "Organized Noize": {
        "biography": "Atlanta production trio who created Dungeon Family sound.",
        "fun_facts": "Named studio The Dungeon - in actual basement. Discovered OutKast and Goodie Mob.",
        "production_techniques": "Live instrumentation, Southern soul samples, funky bass lines, organic drums.",
        "notable_albums": "OutKast - ATLiens, Southernplayalisticadillacmuzik, TLC - Waterfalls"
    },
    "Johnny J": {
        "biography": "West Coast producer and 2Pac's closest collaborator.",
        "fun_facts": "Produced over 150 2Pac songs. Made beats in prison visiting room for Tupac.",
        "production_techniques": "Dark G-funk, melodic keys, deep bass, emotional strings.",
        "notable_albums": "2Pac - All Eyez on Me, Me Against the World"
    },
    "Daz Dillinger": {
        "biography": "Snoop's cousin, half of Tha Dogg Pound.",
        "fun_facts": "Produced at 16 years old. Made beats for Death Row while still in high school.",
        "production_techniques": "G-funk synthesizers, Parliament samples, laid-back grooves.",
        "notable_albums": "2Pac - All Eyez on Me (Ambitionz Az a Ridah), Snoop - Doggystyle"
    },
    "Eric B.": {
        "biography": "DJ and producer who pioneered James Brown sampling.",
        "fun_facts": "First producer to use 'Funky Drummer' break. Taught Diddy how to sample.",
        "production_techniques": "Hard drums, James Brown breaks, minimal bass, raw aesthetic.",
        "notable_albums": "Eric B. & Rakim - Paid in Full, Follow the Leader"
    },
    "Hit-Boy": {
        "biography": "California producer who blends orchestral and trap.",
        "fun_facts": "Made 'N***as in Paris' for Jay-Z/Kanye at age 24. Nephew of rapper Keyshia Cole.",
        "production_techniques": "Orchestral strings, hard trap drums, cinematic builds, modern bounce.",
        "notable_albums": "Kendrick - GKMC, Jay-Z/Kanye - Watch the Throne, Nas - King's Disease"
    },
    "The Bomb Squad": {
        "biography": "Public Enemy's production team, sonic terrorists.",
        "fun_facts": "4-person team: Hank, Keith, Eric, Chuck. Layered 40+ samples per track.",
        "production_techniques": "Dense sample collages, sirens, noise, aggressive drums, political samples.",
        "notable_albums": "Public Enemy - It Takes a Nation, Fear of a Black Planet"
    },
    "L.E.S.": {
        "biography": "Queens producer who helped craft Nas's sound.",
        "fun_facts": "Large Professor's protégé. Made 'Life's a Bitch' at age 19.",
        "production_techniques": "Jazz loops, dusty drums, piano stabs, Queens street sound.",
        "notable_albums": "Nas - Illmatic (Life's a Bitch, The World Is Yours remix)"
    },
    
    # Rock/Prog Producers
    "Jimmy Page": {
        "biography": "Led Zeppelin guitarist who pioneered studio techniques.",
        "fun_facts": "Used violin bow on guitar. Owned Aleister Crowley's house. Multi-tracked guitars before anyone.",
        "production_techniques": "Natural room ambience, minimal mics on drums, backwards echo, layered guitars.",
        "notable_albums": "Led Zeppelin I-IV, Physical Graffiti"
    },
    "Roger Waters": {
        "biography": "Pink Floyd bassist, conceptual mastermind.",
        "fun_facts": "Father died in WWII - influenced entire career. Wrote The Wall in hotel room on tour.",
        "production_techniques": "Concept albums, sound effects, unconventional recording, emotional narratives.",
        "notable_albums": "Pink Floyd - The Wall, Dark Side of the Moon (co-producer)"
    },
    "David Gilmour": {
        "biography": "Pink Floyd guitarist with vocal tone like butter.",
        "fun_facts": "Used Hiwatt amps and vintage Stratocasters. Plays fewer notes than anyone - every note perfect.",
        "production_techniques": "Lush guitar tones, vocal harmonies, space and atmosphere.",
        "notable_albums": "Pink Floyd - Division Bell, Momentary Lapse of Reason"
    },
    "Bob Ezrin": {
        "biography": "Canadian producer who turned rock into theater.",
        "fun_facts": "Added children's choir to Another Brick in the Wall. Works with orchestras and rock bands equally.",
        "production_techniques": "Orchestral arrangements, sound effects, concept album structure, theatrical elements.",
        "notable_albums": "Pink Floyd - The Wall, Alice Cooper - Welcome to My Nightmare, Kiss - Destroyer"
    },
    "Terry Brown": {
        "biography": "Rush's producer for their golden decade.",
        "fun_facts": "Recorded Rush's Moving Pictures in 7 weeks. Captured Neil Peart's drums perfectly.",
        "production_techniques": "Natural drum sound, clarity in complex arrangements, minimal compression.",
        "notable_albums": "Rush - 2112, Moving Pictures, Permanent Waves, Hemispheres"
    },
    "Eddy Offord": {
        "biography": "Engineer/producer for Yes and ELP.",
        "fun_facts": "Started as tea boy at Advision Studios. Pioneered multi-track recording for prog.",
        "production_techniques": "Multi-tracking complex arrangements, EQ mastery, capturing live energy.",
        "notable_albums": "Yes - Close to the Edge, Fragile, ELP - Brain Salad Surgery"
    },
    "David Hitchcock": {
        "biography": "British producer who captured prog rock's golden era.",
        "fun_facts": "Worked at Abbey Road Studios. Produced Caravan and Genesis.",
        "production_techniques": "Warm analog sound, natural instrument placement, prog complexity clarity.",
        "notable_albums": "Genesis - Foxtrot, Caravan - In the Land of Grey and Pink"
    },
    "Greg Lake": {
        "biography": "ELP bassist who also produced the band.",
        "fun_facts": "Sang King Crimson's '21st Century Schizoid Man'. Perfectionist who did 100+ takes.",
        "production_techniques": "Vocal precision, keyboard prominence, classical influences.",
        "notable_albums": "ELP - Emerson Lake & Palmer, Tarkus, Brain Salad Surgery"
    },
    "Ian Anderson": {
        "biography": "Jethro Tull's flute-playing leader and producer.",
        "fun_facts": "Plays flute standing on one leg. Has degree in theology.",
        "production_techniques": "Flute textures, folk influences, concept album structure.",
        "notable_albums": "Jethro Tull - Thick as a Brick, Aqualung"
    },
    "Glyn Johns": {
        "biography": "Legendary British engineer who recorded The Who and Stones.",
        "fun_facts": "Invented 'Glyn Johns drum mic technique' - 3 mics for entire kit. Recorded in churches for ambience.",
        "production_techniques": "Minimal miking, natural room sound, clarity, punch.",
        "notable_albums": "The Who - Who's Next, Rolling Stones - Sticky Fingers, Led Zeppelin (engineer)"
    },
    
}

# Additional producer data continues...
PRODUCER_DATA.update({
    "John Burns": {
        "biography": "British producer for Genesis during their prog era.",
        "fun_facts": "Worked at Island Studios. Captured Gabriel's theatrical performances.",
        "production_techniques": "Prog complexity, clarity in dense arrangements, acoustic detail.",
        "notable_albums": "Genesis - Selling England by the Pound, A Trick of the Tail"
    },
    "Ken Caillat": {
        "biography": "Co-producer of Fleetwood Mac's Rumours.",
        "fun_facts": "Recorded band members separately - they weren't speaking. Spent 7 months on album.",
        "production_techniques": "Pop production, vocal harmonies, studio polish, emotional depth.",
        "notable_albums": "Fleetwood Mac - Rumours, Tusk"
    },
    "Richard Dashut": {
        "biography": "Fleetwood Mac's co-producer and engineer.",
        "fun_facts": "Started as receptionist at studio. Lindsey Buckingham's right-hand man.",
        "production_techniques": "Layered guitars, vocal perfection, studio experimentation.",
        "notable_albums": "Fleetwood Mac - Rumours, Tusk, Mirage"
    },
    "Robert John 'Mutt' Lange": {
        "biography": "South African producer who made rock radio-friendly.",
        "fun_facts": "Married Shania Twain. Known for 100+ vocal takes. Def Leppard took 4 years to make an album with him.",
        "production_techniques": "Vocal layering, perfect drums, pop hooks in rock, compression mastery.",
        "notable_albums": "AC/DC - Back in Black, Def Leppard - Pyromania, Foreigner - 4"
    },
    "Bill Szymczyk": {
        "biography": "Producer who gave Eagles their California sound.",
        "fun_facts": "Started in Chicago blues scene. Built studio in Miami mansion.",
        "production_techniques": "Clean production, vocal harmonies, country-rock blend.",
        "notable_albums": "Eagles - Hotel California, One of These Nights, The Who - Who Are You"
    },
    "Mike Clink": {
        "biography": "Engineer who captured Guns N' Roses' raw energy.",
        "fun_facts": "Worked with Triumph and UFO before GNR. Recorded Appetite in 6 weeks.",
        "production_techniques": "Live energy capture, minimal overdubs, raw guitar tones.",
        "notable_albums": "Guns N' Roses - Appetite for Destruction, Use Your Illusion"
    },
    "Jon Landau": {
        "biography": "Rock critic turned producer, Springsteen's manager.",
        "fun_facts": "Wrote 'I saw rock and roll future and its name is Bruce Springsteen' before producing him.",
        "production_techniques": "Wall of sound, working-class narratives, live band energy.",
        "notable_albums": "Bruce Springsteen - Born to Run, Darkness on the Edge of Town"
    },
    "Mike Appel": {
        "biography": "Springsteen's first manager and producer.",
        "fun_facts": "Discovered Springsteen at audition. Later sued Bruce - lost.",
        "production_techniques": "Raw Phil Spector influence, passionate performances.",
        "notable_albums": "Bruce Springsteen - Greetings from Asbury Park, The Wild, the Innocent"
    },
    "Daniel Lanois": {
        "biography": "Canadian producer who adds atmospheric depth.",
        "fun_facts": "Built studio in New Orleans mansion. Uses Echoplex tape delay on everything.",
        "production_techniques": "Ambient textures, tape echo, atmospheric soundscapes, emotional depth.",
        "notable_albums": "U2 - The Joshua Tree, Achtung Baby, Bob Dylan - Time Out of Mind"
    },
    "Tom Scholz": {
        "biography": "MIT engineer who built Boston in his basement.",
        "fun_facts": "Has over 30 patents. Rockman headphone amp sold millions. Perfectionist - took 8 years for second album.",
        "production_techniques": "Layered guitars (100+ tracks), Rockman amp sound, studio mastery.",
        "notable_albums": "Boston - Boston, Don't Look Back"
    },
    "John Boylan": {
        "biography": "Producer who helped craft Boston's radio sound.",
        "fun_facts": "Originally hired as producer - Tom Scholz did most production. Worked with Linda Ronstadt.",
        "production_techniques": "Radio-friendly mixing, vocal production, pop sensibility.",
        "notable_albums": "Boston - Boston (credited), Linda Ronstadt albums"
    },
    
    # Jazz Producers
    "Teo Macero": {
        "biography": "Miles Davis' producer who pioneered tape editing.",
        "fun_facts": "Trained as classical composer. Edited 3-hour jam sessions into 20-minute masterpieces.",
        "production_techniques": "Tape editing, post-production composition, studio as instrument.",
        "notable_albums": "Miles Davis - Kind of Blue, Bitches Brew, In a Silent Way"
    },
    "Alfred Lion": {
        "biography": "Blue Note Records founder, captured hard bop perfectly.",
        "fun_facts": "German immigrant who fled Nazis. Recorded in Rudy Van Gelder's parents' living room.",
        "production_techniques": "Live to tape, natural sound, minimal editing, artist freedom.",
        "notable_albums": "John Coltrane - Blue Train, Thelonious Monk - Genius of Modern Music"
    },
    "Bob Thiele": {
        "biography": "Impulse! Records producer, captured free jazz.",
        "fun_facts": "Produced over 1000 albums. Married singer Teresa Brewer. Wrote 'What a Wonderful World'.",
        "production_techniques": "Artist-first approach, spiritual recording atmosphere, minimal interference.",
        "notable_albums": "John Coltrane - A Love Supreme, Duke Ellington - Money Jungle"
    },
    "Norman Granz": {
        "biography": "Jazz impresario who created Jazz at the Philharmonic.",
        "fun_facts": "Fought segregation - refused to play segregated venues. Managed Ella and Oscar Peterson.",
        "production_techniques": "Live concert recordings, artist freedom, high fidelity.",
        "notable_albums": "Ella & Louis, Oscar Peterson Trio albums"
    },
    "Irving Townsend": {
        "biography": "Columbia Records producer during jazz's golden age.",
        "fun_facts": "Produced Miles, Brubeck, Monk. Wrote 'The Once Again Prince' about dog.",
        "production_techniques": "Clean recording, natural sound, minimal production.",
        "notable_albums": "Miles Davis - Kind of Blue, Dave Brubeck - Time Out"
    },
    "Nesuhi Ertegun": {
        "biography": "Atlantic Records jazz producer, brother of Ahmet.",
        "fun_facts": "Turkish immigrant. Built Atlantic's jazz catalogue. Jazz encyclopedia knowledge.",
        "production_techniques": "Respectful of artists, natural recording, excellent ear.",
        "notable_albums": "John Coltrane - Giant Steps, Charles Mingus albums"
    },
    "David Rubinson": {
        "biography": "Producer who brought funk to jazz.",
        "fun_facts": "Started with Moby Grape. Helped Herbie Hancock go electric.",
        "production_techniques": "Funk grooves, electronic textures, fusion production.",
        "notable_albums": "Herbie Hancock - Head Hunters, Santana - Abraxas"
    },
    
    # Self-produced artists (minimal data)
    "A Tribe Called Quest": {
        "biography": "Self-produced their innovative jazz-rap sound.",
        "fun_facts": "Q-Tip produced most tracks. Democracy in production - all voted.",
        "production_techniques": "Jazz samples, live bass, minimal drums, positive vibes.",
        "notable_albums": "The Low End Theory, Midnight Marauders"
    },
    "Pink Floyd": {
        "biography": "Self-produced most albums after first two.",
        "fun_facts": "Spent 6 months recording Dark Side. Built own studio - Britannia Row.",
        "production_techniques": "Concept albums, sound effects, studio experimentation, sonic landscapes.",
        "notable_albums": "Dark Side of the Moon, Wish You Were Here"
    },
    "King Crimson": {
        "biography": "Robert Fripp produced most albums.",
        "fun_facts": "Fripp uses diary to document every recording decision. Perfectionist.",
        "production_techniques": "Complex arrangements, precision, experimental sounds.",
        "notable_albums": "In the Court of the Crimson King, Red"
    },
    "Genesis": {
        "biography": "Self-produced during prog era with outside engineers.",
        "fun_facts": "Democracy in studio almost killed band. Each member had veto power.",
        "production_techniques": "Prog complexity, theatrical arrangements, clarity.",
        "notable_albums": "Selling England by the Pound (with John Burns)"
    },
    "Rush": {
        "biography": "Self-produced with Terry Brown, later alone.",
        "fun_facts": "Peart insisted on natural drum sound. Lifeson played most keyboards.",
        "production_techniques": "Precision, live-to-studio energy, technical excellence.",
        "notable_albums": "Moving Pictures (with Terry Brown)"
    },
    "The Who": {
        "biography": "Self-produced several albums with assistance.",
        "fun_facts": "Pete Townshend: 'We produce, others engineer'. Kit Lambert taught them.",
        "production_techniques": "Raw power, live energy, rock opera ambition.",
        "notable_albums": "Who's Next (with Glyn Johns)"
    },
    "Fleetwood Mac": {
        "biography": "Co-produced Rumours with Ken Caillat and Richard Dashut.",
        "fun_facts": "Lindsey Buckingham controlled guitar sounds obsessively.",
        "production_techniques": "Vocal harmonies, studio polish, layered guitars.",
        "notable_albums": "Rumours, Tusk"
    },
    "Bruce Springsteen": {
        "biography": "Co-produced with Jon Landau and Mike Appel.",
        "fun_facts": "Spent months mixing Born to Run. Lives in studio for albums.",
        "production_techniques": "Wall of sound, passionate performances, perfectionism.",
        "notable_albums": "Born to Run, Born in the U.S.A."
    },
    "Yes": {
        "biography": "Self-produced with Eddy Offord engineering.",
        "fun_facts": "Steve Howe controlled guitar sounds. Rick Wakeman wanted church organs.",
        "production_techniques": "Complex arrangements, pristine sound, virtuoso performances.",
        "notable_albums": "Close to the Edge, Fragile"
    },
    "Herbie Hancock": {
        "biography": "Self-produced Head Hunters with David Rubinson.",
        "fun_facts": "First jazz artist to embrace synthesizers fully.",
        "production_techniques": "Funk grooves, synthesizers, jazz-fusion.",
        "notable_albums": "Head Hunters, Rockit"
    },
    "ELP": {
        "biography": "Self-produced with Greg Lake at helm.",
        "fun_facts": "Keith Emerson's Moog required electrical engineer on tour.",
        "production_techniques": "Classical arrangements, keyboard prominence, orchestral scope.",
        "notable_albums": "Emerson Lake & Palmer, Brain Salad Surgery"
    },
    "Terry Ellis": {
        "biography": "Chrysalis Records co-founder, produced Jethro Tull.",
        "fun_facts": "Manager turned producer. Built Chrysalis into major label.",
        "production_techniques": "Captured live energy, folk-rock blend.",
        "notable_albums": "Jethro Tull - Thick as a Brick"
    },
})

def update_artists_with_fun_facts(db: Session, use_wikipedia: bool = True):
    """Update all artists missing fun_facts"""
    print("🎤 Updating artists with fun facts...\n")
    
    # Get artists without fun_facts
    artists = db.query(Artist).filter(
        (Artist.fun_facts == None) | (Artist.fun_facts == "")
    ).all()
    
    print(f"Found {len(artists)} artists to update\n")
    
    updated = 0
    wiki_fetched = 0
    
    for artist in artists:
        print(f"🎵 {artist.name}")
        
        # Check if we have manual data
        if artist.name in ARTIST_FUN_FACTS:
            data = ARTIST_FUN_FACTS[artist.name]
            artist.biography = data["biography"]
            artist.fun_facts = data["fun_facts"]
            print(f"  ✅ Added manual fun facts")
            updated += 1
        
        # Fetch Wikipedia if requested and not already there
        if use_wikipedia and not artist.wikipedia_bio:
            try:
                wiki_bio = WikipediaService.get_artist_bio(artist.name, artist.genre)
                if wiki_bio:
                    artist.wikipedia_bio = wiki_bio
                    print(f"  📚 Fetched Wikipedia bio")
                    wiki_fetched += 1
            except Exception as e:
                print(f"  ⚠️  Wikipedia fetch failed: {e}")
        
        print()
    
    db.commit()
    print(f"✅ Updated {updated} artists with fun facts")
    print(f"📚 Fetched {wiki_fetched} Wikipedia bios\n")


def update_producers_with_data(db: Session, use_wikipedia: bool = True):
    """Update all producers missing data"""
    print("🎛️  Updating producers with complete data...\n")
    
    # Get producers without fun_facts
    producers = db.query(Producer).filter(
        (Producer.fun_facts == None) | (Producer.fun_facts == "")
    ).all()
    
    print(f"Found {len(producers)} producers to update\n")
    
    updated = 0
    wiki_fetched = 0
    
    for producer in producers:
        print(f"🔧 {producer.name}")
        
        # Check if we have manual data
        if producer.name in PRODUCER_DATA:
            data = PRODUCER_DATA[producer.name]
            producer.biography = data.get("biography")
            producer.fun_facts = data.get("fun_facts")
            producer.production_techniques = data.get("production_techniques")
            producer.notable_albums = data.get("notable_albums")
            print(f"  ✅ Added complete data")
            updated += 1
        
        # Fetch Wikipedia if requested
        if use_wikipedia and not producer.wikipedia_bio:
            try:
                wiki_bio = WikipediaService.get_producer_bio(producer.name)
                if wiki_bio:
                    producer.wikipedia_bio = wiki_bio
                    print(f"  📚 Fetched Wikipedia bio")
                    wiki_fetched += 1
            except Exception as e:
                print(f"  ⚠️  Wikipedia fetch failed: {e}")
        
        print()
    
    db.commit()
    print(f"✅ Updated {updated} producers with complete data")
    print(f"📚 Fetched {wiki_fetched} Wikipedia bios\n")


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed fun facts and data')
    parser.add_argument('--no-wikipedia', action='store_true',
                        help='Skip Wikipedia fetching')
    parser.add_argument('--artists-only', action='store_true',
                        help='Only update artists')
    parser.add_argument('--producers-only', action='store_true',
                        help='Only update producers')
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        print("="*70)
        print("🎵 SEEDING FUN FACTS AND DATA")
        print("="*70)
        print()
        
        use_wiki = not args.no_wikipedia
        
        if not args.producers_only:
            update_artists_with_fun_facts(db, use_wiki)
        
        if not args.artists_only:
            update_producers_with_data(db, use_wiki)
        
        print("="*70)
        print("🎉 COMPLETE!")
        print("="*70)
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()