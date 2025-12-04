import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.album import Album
from app.models.artist import Artist
from app.models.producer import Producer
from app.models.rating import Rating

def seed_artists():
    db = SessionLocal()
    
    existing = db.query(Artist).first()
    if existing:
        print("❌ Baza već ima izvođače. Preskačem seed.")
        db.close()
        return db.query(Artist).all()
    
    print("👤 Dodajem izvođače...")
    
    artists_data = [
        {
            "name": "Nas",
            "region": "east_coast",
            "era": "golden_age",
            "image_url": "images/artists/nasir.jpg",
            "biography": "Nasir Jones, poznat kao Nas, rođen je 1973. u Queensbridge projektima, New Yorku. Sin jazz glazbenika Olu Dare, Nas je odrastao okružen glazbom. Napustio je školu u 8. razredu kako bi se posvetio repu.",
            "fun_facts": "Nas je odbio feature na Dr. Dre's 'Chronic 2001' - kasnije je to nazvao najvećom greškom karijere. Nikada nije diplomirao srednju školu, ali piše poeziju na college razini.",
            "influence_score": 9.8
        },
        {
            "name": "The Notorious B.I.G.",
            "region": "east_coast",
            "era": "golden_age",
            "image_url": "images/artists/bigus.jpg",
            "biography": "Christopher Wallace, poznat kao Biggie, rođen je 1972. u Brooklynu. Ubijen je 1997. u drive-by pucnjavi u Los Angelesu, u dobi od samo 24 godine.",
            "fun_facts": "Biggie je bio izvrsni učenik u školi. Njegov album 'Ready to Die' snimljen je u samo 3 tjedna. Imao je fotopamćenje - mogao je zapamtiti cijele stihove nakon jednog slušanja.",
            "influence_score": 9.9
        },
        {
            "name": "Dr. Dre",
            "region": "west_coast",
            "era": "golden_age",
            "image_url": "images/artists/dre.jpg",
            "biography": "Andre Young, poznat kao Dr. Dre, rođen je 1965. u Comptonu. Počeo je kao DJ u klubu. Bio je član World Class Wreckin' Cru prije nego što je osnovao N.W.A.",
            "fun_facts": "Dre nikada nije bio licenciran doktor. Prodao je Beats by Dre Apple-u za 3 milijarde dolara 2014. Perfekcionist je - provodi 10+ sati miksajući jedan hi-hat zvuk.",
            "influence_score": 10.0
        },
        {
            "name": "Wu-Tang Clan",
            "region": "east_coast",
            "era": "golden_age",
            "image_url": "images/artists/wu.jpg",
            "biography": "Wu-Tang Clan je hip hop kolektiv formiran 1992. na Staten Islandu. RZA je bio mozak iza grupe, okupivši 9 MC-eva.",
            "fun_facts": "Ime 'Wu-Tang' dolazi iz kung-fu filma. RZA je sve beat-ove radio na jeftinom sampleru od 1000 dolara. Snimili su album u samo 1 kopiji i prodali ga za 2 milijuna dolara.",
            "influence_score": 9.7
        },
        {
            "name": "Snoop Dogg",
            "region": "west_coast",
            "era": "golden_age",
            "image_url": "images/artists/snup.jpg",
            "biography": "Calvin Broadus Jr., poznat kao Snoop Dogg, rođen je 1971. u Long Beachu. Dr. Dre ga je otkrio kroz demo kasetu.",
            "fun_facts": "Snoop je dobio nadimak od majke jer je bio sličan Snoopy-ju. Bio je optužen za ubojstvo 1993. ali je oslobođen. Kuha show s Martha Stewart na TV-u.",
            "influence_score": 9.3
        },
        {
            "name": "2Pac",
            "region": "west_coast",
            "era": "golden_age",
            "image_url": "images/artists/tupak.jpg",
            "biography": "Tupac Shakur, rođen je 1971. u New Yorku. Majka Afeni bila je članica Black Panthers. Ubijen je 1996. u Las Vegasu u dobi od 25 godina.",
            "fun_facts": "2Pac je imao tetovažu 'Thug Life' gdje svako slovo znači nešto. Snimio je preko 150 pjesama dok je bio u zatvoru. Bio je angažiran u 7 filmova.",
            "influence_score": 10.0
        },
        {
            "name": "Lauryn Hill",
            "region": "east_coast",
            "era": "late_90s",
            "image_url": "images/artists/larahil.jpg",
            "biography": "Lauryn Hill, rođena 1975. Postala je poznata kao članica Fugees. Solo album 'Miseducation' slomio je rekorde - 5 Grammy nagrada.",
            "fun_facts": "Lauryn je imala samo 22 godine kada je izdala 'Miseducation'. Odbila je biti na naslovnici Rolling Stonea jer su htjeli da bude seksualizirana.",
            "influence_score": 9.5
        },
        {
            "name": "A Tribe Called Quest",
            "region": "east_coast",
            "era": "golden_age",
            "image_url": "images/artists/tribekaled.jpg",
            "biography": "Formiran 1985. u Queensu, New York. Članovi Q-Tip, Phife Dawg, Ali Shaheed Muhammad pioniri su jazz-rap zvuka.",
            "fun_facts": "Ime grupe smislio je Jungle Brothers. Album cover 'Midnight Marauders' sadrži preko 70 hip hop legendi.",
            "influence_score": 9.4
        },
        {
            "name": "Eric B. & Rakim",
            "region": "east_coast",
            "era": "golden_age",
            "image_url": "images/artists/bratrakim.jpg",
            "biography": "Eric Barrier (DJ) i William Griffin Jr. (Rakim) formirali su duo 1986. Rakim je revolucionirao MCing s kompleksnim rimama.",
            "fun_facts": "Rakim je studirao jazz saksofon. Nikada nije pisao stihove - sve je improvizirao u studiju. KRS-One ga je nazvao 'bogom MCinga'.",
            "influence_score": 9.8
        },
        {
            "name": "Ice Cube",
            "region": "west_coast",
            "era": "golden_age",
            "image_url": "images/artists/icecube.jpg",
            "biography": "O'Shea Jackson, rođen je 1969. u Los Angelesu. Bio je glavni pisac za N.W.A - napisao je većinu 'Straight Outta Compton'.",
            "fun_facts": "Ime 'Ice Cube' dobio je od brata. Studirao je arhitektonski crtež. Postao je holivudska zvijezda s 'Boyz n the Hood' i 'Friday' serijalom.",
            "influence_score": 9.2
        }
    ]
    
    created_artists = []
    for artist_data in artists_data:
        artist = Artist(**artist_data)
        db.add(artist)
        created_artists.append(artist)
        print(f"✅ Dodao: {artist_data['name']}")
    
    db.commit()
    
    # Refresh objekti prije nego zatvorimo sesiju
    artist_dict = {}
    for artist in created_artists:
        db.refresh(artist)
        artist_dict[artist.name] = artist.id
    
    print(f"\n🔥 Uspješno dodano {len(artists_data)} izvođača!")
    db.close()
    
    return artist_dict  # <-- MORA BITI DICT, NE created_artists

def seed_producers():
    db = SessionLocal()
    
    existing = db.query(Producer).first()
    if existing:
        print("❌ Baza već ima producente. Preskačem seed.")
        db.close()
        return db.query(Producer).all()
    
    print("🎛️ Dodajem producente...")
    
    producers_data = [
        {
            "name": "DJ Premier",
            "signature_sound": "Boom Bap, Jazz Samples, Scratch Hooks",
            "image_url": "images/producers/preemo.jpg",
            "biography": "Christopher Martin, poznat kao DJ Premier, rođen je 1966. Polovina Gang Starr dua. Prepoznatljiv po 'boom bap' zvuku - teški breakbeati i jazz samplovi.",
            "fun_facts": "Premier NIKADA ne sampla isti record dvaput. Njegove scratch hook-ove može prepoznati svaki hip hop fan. Koristi Akai MPC 60 još od 90-ih.",
            "production_techniques": "Scratch hooks, chopped jazz samples, heavy kick-snare drums, minimal bass, vintage vinyl cracks.",
            "notable_albums": "Nas - Illmatic (NY State of Mind), Notorious B.I.G. - Ready to Die (Unbelievable), Jay-Z - Reasonable Doubt, Gang Starr - Moment of Truth"
        },
        {
            "name": "Dr. Dre",
            "signature_sound": "G-Funk, Synth Bass, P-Funk Samples",
            "image_url": "images/producers/dre.jpg",
            "biography": "Andre Young kao producent definirao je West Coast zvuk. 'The Chronic' (1992) uveo je G-funk u mainstream.",
            "fun_facts": "Dre provodi 10+ sati savršavajući zvuk hi-hat-a. Nije programer - sve radi na konzolama. Otkrio je Snoop Dogg-a, Eminem-a, 50 Cent-a.",
            "production_techniques": "Thick bass lines (Moog synth), melodic synth leads, live instrumentation, P-Funk grooves, slow tempo (90-100 BPM).",
            "notable_albums": "Dr. Dre - The Chronic (1992), Snoop Dogg - Doggystyle (1993), 2Pac - California Love, Eminem - The Slim Shady LP"
        },
        {
            "name": "RZA",
            "signature_sound": "Dusty Soul Samples, Kung-Fu Strings, Dark Atmospheric",
            "image_url": "images/producers/rizone.jpg",
            "biography": "Robert Diggs, poznat kao RZA. Mozak Wu-Tang Clana. Njegov 'lo-fi' dirty sound postao je legendarni.",
            "fun_facts": "RZA je sve Wu-Tang beat-ove radio na jeftinom Ensoniq sampleru od 1000 dolara. Gledao je 1000+ kung-fu filmova. Producirao je 5 beat-ova dnevno.",
            "production_techniques": "Pitch down samples, minimal drums, dark cinematic strings, vocal samples from kung-fu films, off-kilter rhythms.",
            "notable_albums": "Wu-Tang Clan - Enter the Wu-Tang 36 Chambers (1993), GZA - Liquid Swords (1995), Raekwon - Only Built 4 Cuban Linx"
        },
        {
            "name": "Pete Rock",
            "signature_sound": "Soul & Jazz Samples, Horn Loops, Warm Bass",
            "image_url": "images/producers/pero.jpg",
            "biography": "Peter Phillips, rođen 1970. Formirao duo Pete Rock & CL Smooth. Poznat po 'soul' produkciji - koristi jazz i soul samplove s toplim zvukom.",
            "fun_facts": "Pete Rock ima kolekciju od preko 100,000 vinila. Nikada ne koristi ready-made drum loops - sve pravi od nule.",
            "production_techniques": "Horn stabs (jazz trumpet/sax snippets), soul vocal chops, heavy swing in drums, Rhodes piano layers, warm sub bass.",
            "notable_albums": "Nas - Illmatic (The World Is Yours), Pete Rock & CL Smooth - Mecca and the Soul Brother (1992), Run-DMC - Down with the King"
        },
        {
            "name": "Q-Tip",
            "signature_sound": "Jazz Rap, Smooth Samples, Uplifting Vibe",
            "image_url": "images/producers/qtip.jpg",
            "biography": "Jonathan Davis, rođen 1970. Vođa A Tribe Called Quest-a. Pionir 'jazz-rap' žanra.",
            "fun_facts": "Q-Tip je bio DJ prije nego MC. Producirao je Nas-ov 'One Love' za Illmatic. Busta Rhymes bio mu je najbolji prijatelj iz djetinjstva.",
            "production_techniques": "Uplifting jazz samples, smooth baseline grooves, live bass guitar layers, positive vibe-oriented, subtle percussion.",
            "notable_albums": "A Tribe Called Quest - The Low End Theory (1991), Midnight Marauders (1993), Nas - Illmatic (One Love), Mobb Deep - The Infamous"
        },
        {
            "name": "Havoc",
            "signature_sound": "Dark Minimalist, Eerie Pianos, Hard Drums",
            "image_url": "images/producers/havoc.jpg",
            "biography": "Kejuan Muchita, rođen 1974. Polovina Mobb Deep dua. Kreirao 'Queensbridge sound' - dark, haunting production.",
            "fun_facts": "Havoc je produkciju naučio sam. 'Shook Ones Pt. II' beat napravio je u 20 minuta na SP-1200 sampleru.",
            "production_techniques": "Minor key progressions, sparse drums (less is more), eerie piano/string loops, deep sub bass, minimalist approach.",
            "notable_albums": "Mobb Deep - The Infamous (1995) - Shook Ones Pt. II, Survival of the Fittest, Mobb Deep - Hell on Earth (1996)"
        },
        {
            "name": "Timbaland",
            "signature_sound": "Futuristic Synths, Vocal Chops, Stutter Effect",
            "image_url": "images/producers/timbe.jpg",
            "biography": "Timothy Mosley, rođen 1972. Revolucionirao je produkciju krajem 90-ih s futurističkim zvukom.",
            "fun_facts": "Timbaland je dobio ime jer je nosio Timberland cipele. Izgubio je sluh na jedno uho kao dijete. Ne zna čitati note.",
            "production_techniques": "Beatbox-inspired drums, vocal chops as melody, synth arpeggios, stutter/glitch effects, futuristic sound design.",
            "notable_albums": "Jay-Z - The Blueprint (Dirt Off Your Shoulder), Missy Elliott - Under Construction (2002), Justin Timberlake - FutureSex/LoveSounds"
        },
        {
            "name": "J Dilla",
            "signature_sound": "Off-Beat Drums, Soul Samples, 'Drunk' Feel",
            "image_url": "images/producers/dila.jpg",
            "biography": "James Yancey, rođen 1974. Član Slum Village-a. Revolucionario je 'sampling' - njegov off-beat stil postao je legendarni. Umro je 2006.",
            "fun_facts": "Dilla je namjerno micao note 'off the grid' - to je kreirao njegov signature 'drunk' feel. Album 'Donuts' snimio je u bolnici dok je bio na samrti.",
            "production_techniques": "'Quantize off' - ne stavlja note perfectly on beat, micro-timing shifts, heavy swing groove, chops soul samples unconventionally.",
            "notable_albums": "Slum Village - Fantastic Vol. 2 (2000), A Tribe Called Quest - Beats, Rhymes and Life, Common - Like Water for Chocolate, J Dilla - Donuts (2006)"
        }
    ]
    
    created_producers = []
    for producer_data in producers_data:
        producer = Producer(**producer_data)
        db.add(producer)
        created_producers.append(producer)
        print(f"✅ Dodao: {producer_data['name']}")
    
    db.commit()
    
    # Refresh objekti prije nego zatvorimo sesiju
    producer_dict = {}
    for producer in created_producers:
        db.refresh(producer)
        producer_dict[producer.name] = producer.id
    
    print(f"\n🔥 Uspješno dodano {len(producers_data)} producenata!")
    db.close()
    
    return producer_dict  # <-- MORA BITI DICT, NE created_producers

def seed_albums(artists, producers):
    db = SessionLocal()
    
    existing = db.query(Album).first()
    if existing:
        print("❌ Baza već ima albume. Preskačem seed.")
        db.close()
        return
    
    def get_artist_id(name):
        return artists.get(name)  # artists je sad dict
    
    def get_producer_id(name):
        return producers.get(name)  # producers je sad dict
    
    print("🎤 Dodajem albume s pričama...")
    
    albums_data = [
        {
            "title": "Illmatic",
            "artist_id": get_artist_id("Nas"),
            "year": 1994,
            "region": "east_coast",
            "producer_id": get_producer_id("DJ Premier"),
            "label": "Columbia Records",
            "cover_url": "images/illmatic.jpg",
            "story": "Snimljen kada je Nas imao samo 19 godina, Illmatic je nastao u Queensbridge projektima. DJ Premier je rekao da je Nas bio toliko talentiran da su producenti morali podići svoj nivo. Q-Tip je potrošio 3 tjedna savršavajući beat za 'One Love'.",
            "impact": "Album je floppao komercijalno prva dva tjedna - samo 60,000 primjeraka. Danas je smatran najboljim hip hop albumom ikada. Jedini album gdje su SVI producenti legende: Premier, Pete Rock, Q-Tip, L.E.S.",
            "trivia": "'NY State of Mind' snimljen je u jednom take-u. Nas nije napisao ništa na papir - sve iz glave. Album je koštao samo 100,000 dolara da se snimi."
        },
        {
            "title": "Ready to Die",
            "artist_id": get_artist_id("The Notorious B.I.G."),
            "year": 1994,
            "region": "east_coast",
            "producer_id": get_producer_id("DJ Premier"),
            "label": "Bad Boy Records",
            "cover_url": "images/readytodie.jpg",
            "story": "Biggie je bio totalni underdog - Brooklyn rapper bez hype-a. Puffy ga je potpisao nakon što je čuo demo kasetu. Album je sniman dok je Biggie još uvijek živio u jednosobnom stanu s kćeri.",
            "impact": "Album je revolucionirao East Coast hip hop - vratio ga je u mainstream nakon West Coast dominacije. Biggie's storytelling bio je cinematski. Album je posthumno otišao 4x Platinum.",
            "trivia": "Biggie je napisao 'Warning' o stvarnoj situaciji kada su ga opljačkali. Album cover - baby Biggie - simbol njegovog života od rođenja do 'Ready to Die'."
        },
        {
            "title": "The Chronic",
            "artist_id": get_artist_id("Dr. Dre"),
            "year": 1992,
            "region": "west_coast",
            "producer_id": get_producer_id("Dr. Dre"),
            "label": "Death Row Records",
            "cover_url": "images/chronic.jpg",
            "story": "Nakon što je napustio N.W.A, Dre je osnovao Death Row Records sa Suge Knight-om. 'The Chronic' bio je njegov fuck you album. Dre je koristio live instrumente - klavijature, bass gitare. Uveo je Snoop Dogg-a.",
            "impact": "Album je definirao G-Funk sound - melodični synth, funkadelic bass, laid-back grooves. Outsold projections 10x. Established West Coast kao dominantna sila. Album je 3x Platinum samo u prvoj godini.",
            "trivia": "'Nuthin But a G Thang' sample-a Leon Haywood's 'I Wanna Do Something Freaky to You'. George Clinton (P-Funk) bio je advisor."
        },
        {
            "title": "Enter the Wu-Tang (36 Chambers)",
            "artist_id": get_artist_id("Wu-Tang Clan"),
            "year": 1993,
            "region": "east_coast",
            "producer_id": get_producer_id("RZA"),
            "label": "Loud Records",
            "cover_url": "images/wu.jpg",
            "story": "RZA okupio je 9 MC-eva sa Staten Islanda. Album je sniman na budgetu od svega 36,000 dolara. RZA je sve beat-ove pravio na jeftinom Ensoniq sampleru. Kung-fu movie samplovi bili su RZA-ova opsesija.",
            "impact": "Revolucionirali su music business - dozvolili članovima solo karijere dok su još u grupi. Raw, gritty production postao je antiteza polished G-Funk zvuka. Wu-Tang brending - logo, merch - postavili su blueprint.",
            "trivia": "Album nije imao buget za marketing - širio se word of mouth. '36 Chambers' od Shaolin kung-fu trening metode. Ol' Dirty Bastard snimio je 'Shimmy Shimmy Ya' drunk u jednom take-u."
        },
        {
            "title": "It Was Written",
            "artist_id": get_artist_id("Nas"),
            "year": 1996,
            "region": "east_coast",
            "producer_id": get_producer_id("Q-Tip"),
            "label": "Columbia Records",
            "cover_url": "images/nasit.jpg",
            "story": "Nakon Illmatic kritičke hvale ali slabih prodaja, Nas je bio pod pritiskom da napravi komercijalniji album. Nas je angažirao Trackmasters za glađeniji sound. Lauryn Hill feature bio je calculated move za radio airplay.",
            "impact": "Debitirao je #1 na Billboard 200 - nešto što Illmatic nije postigao. Nas je našao balans između street credibility-ja i komercijalnosti. Album je dvostruko platinum.",
            "trivia": "Dr. Dre producirao je 'Nas Is Coming' - njihova jedina kolaboracija. 'I Gave You Power' koncept pjesma (gun perspective) - prvi put u hip hopu."
        },
        {
            "title": "Doggystyle",
            "artist_id": get_artist_id("Snoop Dogg"),
            "year": 1993,
            "region": "west_coast",
            "producer_id": get_producer_id("Dr. Dre"),
            "label": "Death Row Records",
            "cover_url": "images/snoop.jpg",
            "story": "Snoop je snimio debi album dok je bio optužen za ubojstvo. Dre je producirao CIJELI album. Snoop's laid-back flow bio je prirodan - nisu trebali puno take-ova. Nate Dogg pjeva hook-ove na pola albuma.",
            "impact": "Debitirao je #1 na Billboard - fastest selling hip hop album u to vrijeme (800k prva sedmica). Established Snoop kao superstar. Album je prodan u 11 million primjeraka.",
            "trivia": "Album je izašao dok je Snoop bio na sudu - kasnije je oslobođen. '187um' title refers to California penal code za ubojstvo."
        },
        {
            "title": "All Eyez on Me",
            "artist_id": get_artist_id("2Pac"),
            "year": 1996,
            "region": "west_coast",
            "producer_id": get_producer_id("Dr. Dre"),
            "label": "Death Row Records",
            "cover_url": "images/tupek.jpg",
            "story": "2Pac je potpisao za Death Row nakon što ga je Suge Knight platio 1.4 million bail iz zatvora. Album je sniman kroz late 1995-early 1996. 2Pac je bio u creative streak - snimao bi 3 pjesme dnevno.",
            "impact": "Prvi double album u hip hopu koji je debitirao #1. Prodano 566,000 primjeraka u prvom tjednu. Album je izašao 7 mjeseci prije Pac-ove smrti. 10x Platinum posthumno.",
            "trivia": "'California Love' originally je bio Dr. Dre solo track. Album je sniman u samo 2 tjedna - Pac je bio na fire-u."
        },
        {
            "title": "The Miseducation of Lauryn Hill",
            "artist_id": get_artist_id("Lauryn Hill"),
            "year": 1998,
            "region": "east_coast",
            "producer_id": get_producer_id("Lauryn Hill"),
            "label": "Ruffhouse Records",
            "cover_url": "images/lara.jpg",
            "story": "Lauryn je snimila solo album dok je bila trudna s prvim djetetom. Album je sniman u Tuff Gong Studios na Jamajci - Bob Marley's studiju. Lauryn je producirala, pisala i arrangirala većinu albuma.",
            "impact": "Debitirao je #1 - 422,000 prodanih primjeraka prvog tjedna. PRVA žena koja je dobila 10 Grammy nominacija u jednoj godini - osvojila ih je 5 uključujući Album of the Year. Album je prodan u 20+ million primjeraka worldwide.",
            "trivia": "Lauryn je imala samo 22 godine kada je album izašao. 'Doo Wop (That Thing)' debitirao #1 na Billboard. Carlos Santana svirao je gitaru na 'To Zion'."
        },
        {
            "title": "The Low End Theory",
            "artist_id": get_artist_id("A Tribe Called Quest"),
            "year": 1991,
            "region": "east_coast",
            "producer_id": get_producer_id("Q-Tip"),
            "label": "Jive Records",
            "cover_url": "images/tribe.jpg",
            "story": "Tribe je htio napraviti 'jazz rap' album s heavy bass focus. Ron Carter (legendary jazz bassist) svirao je upright bass - prvi put jazz musician direktno kolaborira na hip hop albumu.",
            "impact": "Album je postigao perfect balance između jazz-a i hip hop-a. Established Tribe kao top tier grupa. 'Scenario' s Busta Rhymes gostovanjem postao je instant classic.",
            "trivia": "Ron Carter initially odbio je kolaboraciju jer je mislio da je hip hop 'not real music'. 'Check the Rhime' beat je toliko simple da producenti nisu vjerovali."
        },
        {
            "title": "Paid in Full",
            "artist_id": get_artist_id("Eric B. & Rakim"),
            "year": 1987,
            "region": "east_coast",
            "producer_id": get_producer_id("Eric B. & Rakim"),
            "label": "4th & B'way Records",
            "cover_url": "images/rakim.jpg",
            "story": "Eric B. bio je established DJ na Long Islandu kada je upoznao Rakim-a. Album je sniman u Power Play Studios na minimalnom budgetu. Rakim je improvizirao većinu stihova - nikada ih nije pisao.",
            "impact": "Rakim je revolucionirao MCing - uveo je multi-syllable internal rhymes, compound rhymes, metaphors. Influenced SVAKOG MC-a nakon sebe. KRS-One ga nazvao 'bogom MCing-a'.",
            "trivia": "Rakim je studirao jazz saksofon - to je utjecalo na njegov flow. 'I Know You Got Soul' remix s Coldcut producent-ima postao je veći hit od originala."
        }
    ]
    
    for album_data in albums_data:
        album = Album(**album_data)
        db.add(album)
        print(f"✅ Dodao: {album_data['title']}")
    
    db.commit()
    print(f"\n🔥 Uspješno dodano {len(albums_data)} albuma s pričama!")
    db.close()


def seed_ratings():
    db = SessionLocal()
    
    existing = db.query(Rating).first()
    if existing:
        print("❌ Baza već ima ratinge. Preskačem seed.")
        db.close()
        return
    
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
    
    print("⭐ Dodajem ratinge...")
    
    ratings_data = [
        (1, users[0].id, 5.0, "Absolute masterpiece. Nas' storytelling is unmatched."),
        (1, users[1].id, 5.0, "Best hip hop album ever made."),
        (1, users[2].id, 4.8, "Near perfect. Production and lyricism on another level."),
        (2, users[0].id, 4.9, "Biggie's flow is legendary. RIP to the king."),
        (2, users[1].id, 5.0, "Revolutionary storytelling. Changed the game."),
        (3, users[0].id, 4.7, "G-funk at its finest. Dre's production is untouchable."),
        (3, users[2].id, 4.8, "Defined West Coast sound. Classic!"),
        (4, users[1].id, 5.0, "Raw, gritty, perfect. RZA's production is genius."),
        (4, users[2].id, 4.9, "9 MCs, 1 masterpiece. Kung-fu samples are iconic."),
        (5, users[0].id, 4.3, "Solid follow-up to Illmatic. More commercial but still dope."),
        (6, users[1].id, 4.6, "Snoop's laid-back flow over Dre beats. Perfection."),
        (6, users[2].id, 4.7, "G-funk masterclass. Who Am I is legendary."),
        (7, users[0].id, 4.8, "2Pac's magnum opus. So much energy and emotion."),
        (7, users[1].id, 4.9, "Double album with no skips. RIP Pac."),
        (8, users[2].id, 5.0, "Transcendent. Blend of hip hop and soul. Timeless."),
        (8, users[0].id, 4.9, "Lauryn Hill's genius on full display."),
        (9, users[1].id, 4.8, "Jazz-rap perfection. Tribe elevated the art form."),
        (9, users[2].id, 4.7, "Smooth, intelligent, classic."),
        (10, users[0].id, 4.9, "Rakim changed rap forever. Complex rhyme schemes.")
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
    
    print("\n📊 Računam prosječne ocjene...")
    for album_id in range(1, 11):
        update_album_rating(db, album_id)
    
    print(f"\n🔥 Uspješno dodano {len(ratings_data)} ratinga!")
    db.close()


if __name__ == "__main__":
    print("🚀 Pokrećem MEGA seed script...\n")
    
    Base.metadata.create_all(bind=engine)
    
    artists = seed_artists()
    producers = seed_producers()
    seed_albums(artists, producers)
    seed_ratings()
    
    print("\n✨ MEGA Seed završen!")
    print("🎤 Pokreni server: python -m uvicorn app.main:app --reload")