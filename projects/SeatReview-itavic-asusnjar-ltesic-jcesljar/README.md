# SeatReview - Stadium Seat Review Application

**Live Demo (Frontend):** https://frontend-five-sigma-96.vercel.app

Aplikacija za pregled i ocjenjivanje sjedala na stadionima, dvoranama i kazalistima.

> **Napomena:** Frontend je deployean na Vercel. Backend zahtijeva lokalno pokretanje jer koristi SQLite bazu podataka.

## Funkcionalnosti

- **Pregled mjesta** - Stadioni, dvorane, kazalista
- **Interaktivna mapa sjedala** - SVG vizualizacija s bojama po sekcijama (Zapad, Istok, Sjever, Jug)
- **360° pregled** - Virtualni pogled s pozicije sjedala
- **Sustav recenzija** - Ocjene za udobnost, vidljivost, prostor za noge, cistocu
- **Korisnicki profili** - Registracija, prijava, pregled aktivnosti
- **Validacija lozinke** - Provjera jacine lozinke pri registraciji
- **Favoriti** - Spremanje omiljenih sjedala
- **Admin panel** - Upravljanje korisnicima i sadrzajem
- **Visejezicnost** - Hrvatski i engleski jezik
- **Animirana pozadina** - Nogometno igraliste i kosarkaska dvorana s animacijama
- **Statistike** - Prosjecne ocjene i AI sazetak recenzija

## Tehnologije

### Frontend
- React 18
- Vite
- CSS3 (animacije, glassmorphism efekti)

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- JWT autentifikacija
- bcrypt za hashiranje lozinki

## Pokretanje aplikacije

### Preduvjeti
- Node.js 18+ instaliran
- npm

### 1. Kloniranje repozitorija

```bash
git clone https://github.com/itavic371/2025-intro-swe.git
cd 2025-intro-swe/projects/SeatReview-itavic-asusnjar-ltesic-jcesljar
```

### 2. Pokretanje Backenda

```bash
cd backend
npm install
npm start
```

Backend ce se pokrenuti na `http://localhost:5000`

**Admin pristup:**
- Email: `admin@seatreview.hr`
- Lozinka: `Admin123!`

### 3. Pokretanje Frontenda

U novom terminalu:

```bash
cd frontend
npm install
npm run dev
```

Frontend ce se pokrenuti na `http://localhost:5173`

## Brzo pokretanje (jedna naredba)

Za Windows PowerShell:
```powershell
# U root folderu projekta
cd backend; npm install; Start-Process npm -ArgumentList "start" -NoNewWindow; cd ../frontend; npm install; npm run dev
```

Za Linux/Mac:
```bash
# U root folderu projekta
cd backend && npm install && npm start & cd ../frontend && npm install && npm run dev
```

## Struktura projekta

```
SeatReview-itavic-asusnjar-ltesic-jcesljar/
├── frontend/                 # React aplikacija
│   ├── src/
│   │   ├── App.jsx          # Glavna komponenta s recenzijama i statistikama
│   │   ├── AuthContext.jsx  # Autentifikacija context
│   │   ├── Navigation.jsx   # Navigacija s login/register modalima
│   │   ├── SeatMap.jsx      # Interaktivna SVG mapa sjedala
│   │   ├── Favorites.jsx    # Favoriti korisnika
│   │   ├── Leaderboard.jsx  # Ljestvica aktivnosti korisnika
│   │   ├── UserProfile.jsx  # Profil korisnika
│   │   ├── Photo360Viewer.jsx # 360 stupnjeva pregled
│   │   ├── ViewHistory.jsx  # Povijest pregledanih sjedala
│   │   ├── LanguageContext.jsx # Kontekst za jezik
│   │   ├── translations.js  # Prijevodi HR/EN
│   │   └── styles.css       # Svi stilovi i animacije
│   ├── index.html
│   ├── package.json
│   └── vite.config.mjs
│
├── backend/                  # Express API server
│   ├── index.mjs            # Glavni server s rutama
│   ├── db/                  # SQLite baza podataka
│   ├── uploads/             # Uploadane slike
│   └── package.json
│
├── Specifications.md        # Detaljne specifikacije projekta
├── Dijagram.md             # Arhitektura dijagrami
└── README.md               # Upute za pokretanje
```

## API Endpoints

### Autentifikacija
- `POST /api/auth/register` - Registracija novog korisnika
- `POST /api/auth/login` - Prijava korisnika

### Venues (Mjesta)
- `GET /api/venues` - Dohvati sva mjesta (filtriranje po kategoriji)
- `GET /api/venues/:id` - Dohvati pojedino mjesto

### Recenzije
- `GET /api/venues/:id/reviews` - Recenzije za mjesto
- `POST /api/venues/:id/reviews` - Dodaj novu recenziju (zahtijeva auth)
- `POST /api/reviews/:id/vote` - Glasaj za recenziju (upvote/downvote)

### Favoriti
- `GET /api/favorites` - Dohvati favorite korisnika
- `POST /api/favorites` - Dodaj favorit
- `DELETE /api/favorites/:id` - Ukloni favorit

### Statistike
- `GET /api/venues/:id/stats` - Statistike mjesta (prosjeci ocjena)
- `GET /api/venues/:id/insights` - AI sazetak recenzija
- `GET /api/leaderboard` - Ljestvica najaktivnijih korisnika

### Admin
- `GET /api/admin/users` - Lista korisnika (samo admin)
- `DELETE /api/admin/users/:id` - Obrisi korisnika

## Screenshots

### Pocetna stranica s animiranom pozadinom
Animirano nogometno igraliste i kosarkaska dvorana u pozadini s efektima prijelaza.

### Mapa sjedala
Interaktivna SVG mapa s 4 sekcije (Zapad - plava, Istok - zelena, Sjever - narancasta, Jug - crvena).

### Statistike
Prosjecne ocjene prikazane u plavom krugu s progress barovima za svaku kategoriju.

## Autori

- Ivan Tavic (itavic)
- Ana Susnjar (asusnjar)
- Luka Tesic (ltesic)
- Josip Cesljar (jcesljar)

**Kolegij:** Uvod u programsko inzenjerstvo
**Akademska godina:** 2024/2025

## Licenca

MIT License
