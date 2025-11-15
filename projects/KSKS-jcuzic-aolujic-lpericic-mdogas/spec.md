# 🎤 Old School Hip Hop Recommendations API

## 📋 Sadržaj
- [Uvod](#uvod)
- [Problem](#problem)
- [Rješenje](#rješenje)
- [Funkcionalnosti](#funkcionalnosti)
- [Tehnologije](#tehnologije)
- [Arhitektura](#arhitektura)
- [Instalacija](#instalacija)
- [API Dokumentacija](#api-dokumentacija)
- [Primjeri Korištenja](#primjeri-korištenja)
- [Buduća Proširenja](#buduća-proširenja)

---

## 🎵 Uvod

**Old School Hip Hop Recommendations API** je RESTful web servis razvijen u FastAPI frameworku koji služi kao platforma za istraživanje, evaluaciju i preporuku klasične hip hop glazbe iz zlatnog doba (1980-2000). 

Projekt nastaje iz potrebe za strukturiranim i modernim pristupom arhiviranju i dijeljenju znanja o fundamentalnim djelima hip hop kulture koja su oblikovala žanr i utjecala na generacije slušatelja.

### Motivacija

Hip hop kultura, koja je nastala u Bronxu krajem 1970-ih, doživjela je svoj vrhunac kreativnosti i inovativnosti tijekom 1980-ih i 1990-ih godina. Ovaj period, poznat kao "Golden Age", proizveo je neka od najutjecajnijih albuma u povijesti popularne glazbe. Međutim, nova generacija slušatelja često ima poteškoće u navigaciji kroz opsežan katalog klasičnih djela.

---

## 🔍 Problem

### Identificirani Problemi

#### 1. **Fragmentirane Informacije**
Informacije o old school hip hop glazbi rasute su kroz različite platforme:
- Streaming servisi (Spotify, Apple Music) fokusirani su na moderne algoritme
- Hip hop forumi i Reddit sadrže subjektivna mišljenja bez strukture
- Wikipedia i Discogs nude statičke podatke bez personalizacije
- YouTube komentari pružaju anegdotska iskustva

#### 2. **Nedostatak Konteksta**
Mlađi slušatelji ne razumiju:
- **Geografski kontekst**: Razliku između East Coast (boom bap), West Coast (G-funk), i South (chopped and screwed) zvuka
- **Povijesni značaj**: Zašto su određeni albumi revolucionarni (npr. *Illmatic*, *The Chronic*)
- **Umjetničke veze**: Kako su izvođači međusobno utjecali jedni na druge
- **Produkcijske inovacije**: Tehnike sampling-a, beat-making, storytelling

#### 3. **Overwhelm Novim Slušateljima**
- **Prevelik izbor**: Tisuće albuma bez jasnog ulaznog punkta
- **Gatekeeping kultura**: Elitizam u hip hop zajednici odvraća početnike
- **Nedostupnost vodiča**: Ne postoji centralizirano mjesto za strukturirano učenje

#### 4. **Tehnički Problem**
- Nepostojanje API-ja fokusiranog isključivo na klasični hip hop
- Spotify/Last.fm API-ji nemaju specijalizirane hip hop metapodatke (region, era, subžanr)
- Nedostatak recommendation sistema temeljenog na kulturološkom i glazbenom sličnosti

---

## ✅ Rješenje

### Pristup

**Old School Hip Hop API** nudi centraliziranu, dobro strukturiranu platformu koja:

1. **Agregira kuriran sadržaj**: Ručno odabrani albumi s verifikiranim metapodacima
2. **Edukacija kroz API**: Svaki endpoint pruža kontekst (regionalni stilovi, produkcijske tehnike)
3. **Personalizirane preporuke**: Algoritam koji kombinira glazbenu sličnost i kulturološki kontekst
4. **Pristupačnost**: Jednostavan REST API s jasnom dokumentacijom
5. **Zajednica**: Korisnici mogu ocjenjivati i kreirati playliste

### Koristi

#### Za Slušatelje:
- ✅ Otkrivanje novih klasika prema postojećim preferencijama
- ✅ Učenje o povijesti i kontekstu hip hop kulture
- ✅ Kreiranje personaliziranih playlisti
- ✅ Praćenje vlastitog glazbenog putovanja

#### Za Programere:
- ✅ Gotov API za integraciju u aplikacije
- ✅ Swagger/OpenAPI dokumentacija
- ✅ JSON odgovori za frontend razvoj
- ✅ RESTful best practices

#### Za Istraživače:
- ✅ Strukturirani podaci za analizu hip hop povijesti
- ✅ Metapodaci o regionalnim stilovima
- ✅ Podaci za machine learning modele

---

## 🚀 Funkcionalnosti

### Core Features

#### 1. **Album Management**
- CRUD operacije za albume
- Detaljni metapodaci: izvođač, godina, region, producent, label
- Tracklist s trajanjima
- Cover art URL-ovi

#### 2. **Napredno Pretraživanje**
```
GET /albums?artist=Nas&year=1994&region=east_coast
```
- Filtriranje po izvođaču, godini, regiji, label-u
- Full-text search kroz naslove i opise
- Sortiranje po relevatnosti, godini, ocjeni

#### 3. **Recommendation Engine**
```
GET /recommendations?album_id=5&limit=10
```
Algoritam uzima u obzir:
- **Glazbenu sličnost**: BPM, sampling stil, instrumentacija
- **Regionalni kontekst**: West Coast G-funk → preporuča sličan zvuk
- **Era matching**: Albumi iz istog razdoblja
- **Collaborative filtering**: "Korisnici koji su voleli X voleli su i Y"

#### 4. **User System**
- JWT autentifikacija
- Registracija i login
- User profili s historijom

#### 5. **Rating System**
```
POST /albums/{id}/rate
{ "rating": 5, "review": "Revolutionary album!" }
```
- Ocjenjivanje albuma (1-5 zvjezdica)
- Tekstualni review-i
- Agregirane ocjene

#### 6. **Playlists**
```
POST /playlists
{ "name": "90s East Coast Classics", "album_ids": [1,3,5] }
```
- Kreiranje custom playlisti
- Javne i privatne playliste
- Dijeljenje s drugim korisnicima

#### 7. **Random Discovery**
```
GET /albums/random?era=golden_age
```
- Slučajan klasik za istraživanje
- Filtriranje po eri ili regiji

#### 8. **Statistics & Analytics**
```
GET /stats/top-rated
GET /stats/most-influential
```
- Top ocjenjeni albumi
- Najutjecajniji izvođači
- Trend analiza po dekadama

---

## 🛠 Tehnologije

### Backend
- **FastAPI** 0.104+: Moderni async Python web framework
- **Python** 3.11+: Core jezik
- **SQLAlchemy** 2.0: ORM za bazu podataka
- **Pydantic** v2: Data validacija i serialization
- **Alembic**: Database migrations

### Baza Podataka
- **PostgreSQL** 15+ (production)
- **SQLite** (development/testing)

### Autentifikacija
- **JWT** (JSON Web Tokens): Stateless auth
- **Passlib + Bcrypt**: Password hashing

### Dokumentacija
- **Swagger UI**: Interaktivna API dokumentacija (automatska)
- **ReDoc**: Alternativni docs viewer

### Testing
- **Pytest**: Unit i integration testovi
- **HTTPX**: Async HTTP testing

### Deployment (opciono)
- **Docker**: Kontejnerizacija
- **Docker Compose**: Multi-container setup
- **Uvicorn**: ASGI server

---

## 🏗 Arhitektura

### Project Structure
```
hiphop-api/
│
├── app/
│   ├── main.py              # FastAPI aplikacija
│   ├── config.py            # Konfiguracija
│   ├── database.py          # Database setup
│   │
│   ├── models/              # SQLAlchemy modeli
│   │   ├── user.py
│   │   ├── album.py
│   │   ├── rating.py
│   │   ├── artist.py        # ✨ NOVO
│   │   └── producer.py      # ✨ NOVO
│   │
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── album.py
│   │   ├── rating.py
│   │   ├── artist.py        # ✨ NOVO
│   │   └── producer.py      # ✨ NOVO
│   │
│   ├── api/                 # API endpoints
│   │   ├── auth.py
│   │   ├── albums.py
│   │   ├── ratings.py
│   │   ├── recommendations.py
│   │   ├── artists.py       # ✨ NOVO
│   │   └── producers.py     # ✨ NOVO
│   │
│   ├── crud/                # Database operacije
│   │   ├── user.py
│   │   ├── album.py
│   │   ├── artist.py        # ✨ NOVO
│   │   └── producer.py      # ✨ NOVO
│   │
│   └── core/
│       ├── security.py
│       ├── dependencies.py
│       └── recommendation.py
│
├── frontend/
│   ├── index.html           # Homepage s albumima
│   ├── artists.html         # ✨ NOVO - Stranica izvođača
│   ├── producers.html       # ✨ NOVO - Stranica producenata
│   ├── styles.css
│   ├── app.js
│   ├── artists.js           # ✨ NOVO
│   ├── producers.js         # ✨ NOVO
│   └── images/
│       ├── albums/          # Album cover slike
│       ├── artists/         # ✨ NOVO - Slike izvođača
│       └── producers/       # ✨ NOVO - Slike producenata
│
├── scripts/
│   └── seed_data.py         # Seed (albumi, izvođači, producenti)
│
└── requirements.txt
```

### Database Schema

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   albums    │       │   ratings    │       │    users    │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)      │   ┌───│ id (PK)     │
│ title       │   └──<│ album_id(FK) │   │   │ username    │
│ artist_id   │──┐    │ user_id (FK) │>──┘   │ email       │
│ year        │  │    │ rating       │       │ password    │
│ region      │  │    │ review       │       └─────────────┘
│ producer_id │─┐│    └──────────────┘
│ cover_url   │ ││
│ story       │ ││    ┌──────────────┐
│ impact      │ ││    │   artists    │
│ trivia      │ │└───>├──────────────┤
└─────────────┘ │     │ id (PK)      │
                │     │ name         │
                │     │ region       │
                │     │ era          │
                │     │ image_url    │
                │     │ biography    │
                │     │ fun_facts    │
                │     │ influence    │
                │     └──────────────┘
                │
                │     ┌──────────────┐
                │     │  producers   │
                └────>├──────────────┤
                      │ id (PK)      │
                      │ name         │
                      │ signature    │
                      │ image_url    │
                      │ biography    │
                      │ fun_facts    │
                      │ techniques   │
                      └──────────────┘
```

### API Architecture

```
Client Request
     │
     ▼
┌─────────────────────┐
│   FastAPI Router    │  → Route matching
├─────────────────────┤
│  Dependency Inject  │  → Auth, DB session
├─────────────────────┤
│  Pydantic Validation│  → Request validation
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│   CRUD Operations   │  → Business logic
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│   SQLAlchemy ORM    │  → Database queries
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│   PostgreSQL/SQLite │  → Data storage
└─────────────────────┘
```

---

## 📦 Instalacija

### Preduvjeti
- Python 3.11+
- PostgreSQL 15+ (ili SQLite za development)
- pip ili poetry

### Koraci

1. **Clone repository**
```bash
git clone https://github.com/your-username/hiphop-api.git
cd hiphop-api
```

2. **Kreiraj virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ili
venv\Scripts\activate  # Windows
```

3. **Instaliraj dependencies**
```bash
pip install -r requirements.txt
```

4. **Postavi environment variables**
```bash
cp .env.example .env
# Uredi .env file s tvojim postavkama
```

`.env` example:
```env
DATABASE_URL=postgresql://user:password@localhost/hiphop_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. **Inicijaliziraj bazu**
```bash
alembic upgrade head
```

6. **Seed bazu s početnim podacima (opciono)**
```bash
python scripts/seed_data.py
```

7. **Pokreni server**
```bash
uvicorn app.main:app --reload
```

API je dostupan na: `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

---

## 📚 API Dokumentacija

### Base URL
```
http://localhost:8000/api/v1
```

### Autentifikacija

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "hiphophead",
  "email": "user@example.com",
  "password": "securepass123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=hiphophead&password=securepass123
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Albums

#### Get All Albums
```http
GET /albums?skip=0&limit=20&region=east_coast&year=1994
```

#### Get Single Album
```http
GET /albums/1
```

Response:
```json
{
  "id": 1,
  "title": "Illmatic",
  "artist": "Nas",
  "year": 1994,
  "region": "east_coast",
  "producer": "DJ Premier, Pete Rock, Q-Tip, L.E.S.",
  "label": "Columbia Records",
  "cover_url": "https://example.com/illmatic.jpg",
  "description": "Debut studio album widely regarded as one of the greatest hip hop albums of all time...",
  "avg_rating": 4.9,
  "total_ratings": 1547
}
```

#### Create Album (Admin only)
```http
POST /albums
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "The Chronic",
  "artist": "Dr. Dre",
  "year": 1992,
  "region": "west_coast",
  "producer": "Dr. Dre",
  "label": "Death Row Records"
}
```

### Recommendations

#### Get Similar Albums
```http
GET /recommendations?album_id=1&limit=5
```

Response:
```json
{
  "recommendations": [
    {
      "album": { /* album object */ },
      "similarity_score": 0.92,
      "reason": "Similar East Coast boom bap production and lyrical complexity"
    }
  ]
}
```

### Ratings

#### Rate Album
```http
POST /albums/1/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "review": "Timeless masterpiece. Nas' storytelling is unmatched."
}
```

### Playlists

#### Create Playlist
```http
POST /playlists
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "90s East Coast Essentials",
  "is_public": true,
  "album_ids": [1, 3, 5, 7]
}
```

#### Get User Playlists
```http
GET /playlists/me
Authorization: Bearer {token}
```

### Statistics

#### Top Rated Albums
```http
GET /stats/top-rated?limit=10
```

#### Most Influential Artists
```http
GET /stats/top-artists?limit=10
```

---

## 💡 Primjeri Korištenja

### Python Client Example
```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login
response = requests.post(
    f"{BASE_URL}/auth/login",
    data={"username": "hiphophead", "password": "pass123"}
)
token = response.json()["access_token"]

headers = {"Authorization": f"Bearer {token}"}

# Get recommendations
response = requests.get(
    f"{BASE_URL}/recommendations?album_id=1&limit=5",
    headers=headers
)
recommendations = response.json()

for rec in recommendations["recommendations"]:
    print(f"{rec['album']['title']} by {rec['album']['artist']}")
    print(f"Similarity: {rec['similarity_score']:.2f}")
    print(f"Reason: {rec['reason']}\n")
```

### JavaScript/Frontend Example
```javascript
const BASE_URL = 'http://localhost:8000/api/v1';

// Login
const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
};

// Get albums
const getAlbums = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${BASE_URL}/albums?${params}`);
  return await response.json();
};

// Search East Coast albums from 1994
const albums = await getAlbums({ 
  region: 'east_coast', 
  year: 1994 
});
```

---

## 🔮 Buduća Proširenja

### Planned Features

1. **Advanced Recommendation Algorithm**
   - Machine learning model treniran na user preferences
   - Collaborative filtering
   - Content-based filtering kombiniran s kulturološkim kontekstom

2. **Lyrics Integration**
   - Full lyrics database
   - Search po stihovima
   - Annotation system (kao Genius.com)

3. **Social Features**
   - Following/followers
   - Shared playlists
   - Comments na albume
   - User activity feed

4. **Music Integration**
   - Spotify API integration za streaming
   - YouTube links za slušanje
   - Apple Music deeplinks

5. **Educational Content**
   - Hip hop history timeline
   - Regional style guides
   - Producer profiles
   - Sampling breakdown

6. **Gamification**
   - Badges za istraživanje (npr. "East Coast Expert")
   - Leaderboard aktivnih korisnika
   - Challenges ("Poslušaj 10 West Coast klasika")

7. **Mobile App**
   - iOS/Android aplikacija
   - Push notifikacije za nove albume
   - Offline mode

8. **Admin Dashboard**
   - Web UI za upravljanje sadržajem
   - Analytics dashboard
   - User management

---

## 👨‍💻 Autor

**[Tvoje Ime]**  
Fakultet: [Naziv Fakulteta]  
Kolegij: [Naziv Kolegija]  
Email: your.email@example.com  
GitHub: [@yourusername](https://github.com/yourusername)

---

## 📄 Licenca

MIT License - slobodno korištenje za edukacijske svrhe.

---

## 🙏 Acknowledgments

- Hip hop kultura i svi umjetnici koji su oblikovali žanr
- FastAPI zajednica za odličnu dokumentaciju
- PostgreSQL team
- Open source community

---

**"It ain't where you're from, it's where you're at."** - Rakim