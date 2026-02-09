# 🎵 Classic Albums Archive API

**🌐 Live Website:** [https://2025-intro-swe-neon.vercel.app/](https://2025-intro-swe-neon.vercel.app/)
**📚 API Documentation:** [https://2025-intro-swe-production.up.railway.app/docs](https://2025-intro-swe-production.up.railway.app/docs)
**🎮 Demo:** Try it out! Register, rate albums, leave comments, explore 100+ classic albums!

---

## 📋 Sadržaj
- [Uvod](#uvod)
- [Problem](#problem)
- [Rješenje](#rješenje)
- [Funkcionalnosti](#funkcionalnosti)
- [Tehnologije](#tehnologije)
- [Instalacija](#instalacija)
- [Deployment](#deployment)
- [API Dokumentacija](#api-dokumentacija)

---

## 🎵 Uvod

**Classic Albums Archive API** je RESTful web servis razvijen u FastAPI frameworku koji služi kao platforma za istraživanje, evaluaciju i preporuku klasične glazbe kroz različite žanrove - od hip hop kulture zlatnog doba (1980-2000) do prog rocka, jazza, metala i elektroničke glazbe.

Projekt pruža moderan pristup arhiviranju i dijeljenju znanja o fundamentalnim djelima glazbene povijesti koja su oblikovala žanrove i utjecala na generacije slušatelja.

### Motivacija

Glazbena povijest je bogata klasičnim albumima koji su definirali žanrove. Hip hop kultura iz Bronxa, prog rock revolucija 70-ih, jazz inovacije, klasični rock - sva ta djela zaslužuju pristupačnu platformu za novi generacije. Ovaj projekt omogućava otkrivanje i učenje o tim albumima kroz jednostavan API i interaktivni frontend.

---

## ✅ Rješenje

**Classic Albums Archive API** nudi centraliziranu, dobro strukturiranu platformu koja:

1. **Agregira kuriran sadržaj**: 100+ albuma iz 10 različitih žanrova s verifikiranim metapodacima
2. **Random Discovery**: Svaki refresh stranice prikazuje različite albume za konstantno novo iskustvo
3. **Automatsko dohvaćanje**: Spotify API integracija za cover art, metapodatke i informacije o albumima
4. **Edukacija**: Wikipedia integracija za biografije izvođača i priče o albumima
5. **Zajednica**: Korisnici mogu ocjenjivati, komentirati i kreirati profile

---

## 🚀 Funkcionalnosti

### ✨ Nove Funkcionalnosti

#### 1. **Random Album Rotation** 🎲
- **100+ albuma** u bazi podataka
- **Random prikaz** - svaki refresh stranice prikazuje drugačiji set albuma
- **10 žanrova**: Hip Hop, R&B, Soul, Funk, Jazz, Blues, Classic Rock, Prog Rock, Metal, Electronic
- Nikad dosadno iskustvo - uvijek nešto novo za otkriti!

#### 2. **Automatsko Dohvaćanje iz Spotifya** 🎵
```python
# Auto-fetch na startupu servera
GET /albums/fetch-from-spotify?genre=hip_hop&limit=10
```
- Automatski dohvaća albume iz Spotify API-ja
- Cover art u visokoj rezoluciji
- Metapodaci: label, godina, popularnost
- 142 unaprijed definiranih albuma kroz sve žanrove

#### 3. **Wikipedia Integracija** 📚
```python
POST /albums/{id}/enrich-wikipedia
```
- Biografije izvođača
- Priče o albumima i kontekst
- Fun facts i trivia
- Automatsko obogaćivanje podataka

#### 4. **Komentari i Diskusije** 💬
```python
POST /comments/
{
  "album_id": 1,
  "content": "Best album ever!"
}
```
- Komentiranje albuma
- Diskusije unutar zajednice
- Prikaz komentara po albumu

#### 5. **User Profili** 👤
```python
GET /users/me
GET /users/{id}/ratings
```
- Personalizirani profili korisnika
- Povijest ocjena
- Lista omiljenih albuma
- Tracking glazbenog putovanja

#### 6. **Multi-Genre Support** 🎸
Podržani žanrovi:
- **Hip Hop**: East/West Coast, South, Midwest (25 albuma)
- **Jazz**: Bebop, Cool Jazz, Free Jazz (15 albuma)
- **Classic Rock**: 60s-80s klasici (18 albuma)
- **Prog Rock**: Art Rock, Symphonic (15 albuma)
- **R&B**: 70s-2000s (15 albuma)
- **Soul**: Motown, Neo-Soul (10 albuma)
- **Funk**: P-Funk, Jazz-Funk (10 albuma)
- **Blues**: Chicago, Delta (10 albuma)
- **Metal**: Thrash, Heavy, Doom (12 albuma)
- **Electronic**: IDM, Techno, House (12 albuma)

#### 7. **Napredno Filtriranje** 🔍
```http
GET /albums?genre=hip_hop&region=east_coast&year=1994&random=true
```
- Filtriranje po žanru, regiji, godini, izvođaču
- Random ordering za svaki request
- Pagination s skip/limit parametrima
- Cache-busting za svježe rezultate

#### 8. **Rating System** ⭐
```http
POST /ratings/
{
  "album_id": 1,
  "rating": 5
}
```
- Ocjenjivanje albuma (1-5 zvjezdica)
- Agregirane ocjene (prosjek)
- Top-rated liste
- Real-time update ocjena

#### 9. **Artists & Producers** 🎤🎛️
```http
GET /artists/
GET /producers/
```
- Dedicated stranice za izvođače
- Master producente s biografijama
- Signature zvukovi i tehnike
- Fun facts i influence

#### 10. **Dark/Light Mode** 🌙☀️
- Toggle između dark i light mode
- Persistence u local storage
- Smooth animacije
- Pristupačnost

---

## 🛠 Tehnologije

### Backend
- **FastAPI** 0.104+: Moderni async Python web framework
- **Python** 3.11+: Core jezik
- **SQLAlchemy** 2.0: ORM za bazu podataka
- **Pydantic** v2: Data validacija i serialization
- **PostgreSQL**: Production baza (Railway)
- **SQLite**: Development baza

### External APIs
- **Spotify API**: Album metapodaci, cover art, popularnost
- **Wikipedia API**: Biografije, album priče, kontekst

### Autentifikacija
- **JWT** (JSON Web Tokens): Stateless auth
- **Passlib + Bcrypt 4.1.3**: Password hashing

### Frontend
- **Vanilla JavaScript**: Bez frameworka
- **HTML5/CSS3**: Responsive design
- **Fetch API**: HTTP requests
- **LocalStorage**: Token i theme persistence

### Deployment
- **Railway**: Backend hosting + PostgreSQL
- **Vercel**: Frontend hosting
- **GitHub Actions**: CI/CD (opciono)

---

## 📦 Instalacija

### Lokalni Development

1. **Clone repository**
```bash
git clone https://github.com/augistin97/2025-intro-swe.git
cd hiphop-api
```

2. **Kreiraj virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
```

3. **Instaliraj dependencies**
```bash
pip install -r requirements.txt
```

4. **Postavi environment variables**
```bash
cp .env.example .env
# Uredi .env file
```

`.env` example:
```env
DATABASE_URL=sqlite:///./hiphop.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

5. **Pokreni backend**
```bash
uvicorn app.main:app --reload
```

6. **Pokreni frontend (novi terminal)**
```bash
cd frontend
python -m http.server 8080
```

**Pristup:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🚀 Deployment

### Backend na Railway 🚂

1. **Push na GitHub**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

2. **Railway Setup**
- Idi na https://railway.app
- New Project → Deploy from GitHub repo
- Dodaj PostgreSQL servis
- Postavi environment variables:
  ```
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  SECRET_KEY=<generate-random-key>
  SPOTIFY_CLIENT_ID=<your-id>
  SPOTIFY_CLIENT_SECRET=<your-secret>
  ```

3. **Generate Domain**
- Click "Generate Domain"
- Kopiraj URL (npr. `https://your-app.up.railway.app`)

### Frontend na Vercel 🔺

1. **Update API URL u frontend/app.js**
```javascript
const API_BASE_URL = 'https://your-app.up.railway.app/api/v1';
```

2. **Deploy na Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production
vercel --prod
```

Ili preko Vercel Dashboard:
- Import GitHub repo
- Deploy with default settings

**Detaljne upute: Vidi `DEPLOYMENT.md`**

---

## 📚 API Dokumentacija

### Base URL
```
https://your-app.up.railway.app/api/v1
```

### Endpoints

#### Autentifikacija
- `POST /auth/register` - Registracija
- `POST /auth/login` - Login (JWT token)

#### Albums
- `GET /albums?random=true&limit=50` - Random albumi
- `GET /albums/{id}` - Single album
- `GET /albums?genre=hip_hop&region=east_coast` - Filtriranje
- `POST /albums/fetch-from-spotify` - Dohvati iz Spotifya

#### Ratings
- `POST /ratings/` - Ocijeni album
- `GET /ratings/me` - Moje ocjene
- `GET /ratings/album/{id}` - Ocjene za album

#### Comments
- `POST /comments/` - Komentiraj album
- `GET /comments/album/{id}` - Komentari za album

#### Artists & Producers
- `GET /artists/` - Svi izvođači
- `GET /artists/{id}` - Single izvođač
- `GET /producers/` - Svi producenti
- `GET /producers/{id}` - Single producent

#### Users
- `GET /users/me` - Moj profil
- `GET /users/{id}` - User profil
- `GET /users/{id}/ratings` - User ocjene

#### Recommendations
- `GET /recommendations/top-rated` - Top rated albumi
- `GET /recommendations/random` - Random album

**Swagger Docs:** `https://your-app.up.railway.app/docs`

---

## 🎯 Ključne Feature

### 🎲 Random Discovery
Svaki put kad korisnik refresha stranicu, vidi **drugačije albume** - thanks to:
- SQL random ordering (`ORDER BY RANDOM()`)
- Cache-busting s timestampom
- 100+ albuma u pool-u

### 🎵 Spotify Integration
- Automatski dohvaća cover art
- Metapodaci (label, godina, tracks)
- Popularity score
- 142 predefiniranih albuma

### 📚 Wikipedia Enrichment
- Biografije izvođača s Wikipedije
- Album stories i kontekst
- Fun facts automatski dohvaćeni
- Bulk enrichment endpoint

### 💬 Community Features
- Komentari na albume
- User profili s poviješću
- Rating system (1-5 ⭐)
- Top-rated liste

---

## 💰 Costs & Limits

### Free Tier
- **Railway**: $5 mjesečno (PostgreSQL included)
- **Vercel**: 100GB bandwidth (besplatno)
- **Spotify API**: 10,000 requests/day (besplatno)
- **Wikipedia API**: Unlimited (besplatno)

---

## 📄 Licenca

MIT License - slobodno korištenje za edukacijske svrhe.

---

## 🙏 Credits

- **Hip hop kultura** i svi umjetnici koji su oblikovali žanrove
- **Spotify** za album data API
- **Wikipedia** za biografije i kontekst
- **FastAPI** zajednica za odličnu dokumentaciju
- **Svi classic album fanovi** 🎵

---

**"Music is the universal language."** 🎶

---

## 📞 Contact

Za pitanja i sugestije:
- GitHub: [@augistin97](https://github.com/augistin97)
- Repository: [2025-intro-swe](https://github.com/augistin97/2025-intro-swe)

**Uživaj u klasičnoj glazbi!** 🎵🎸🎤🎛️
