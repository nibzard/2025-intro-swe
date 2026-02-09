# 🎵 TuneBuddy - Glazbena društvena mreža

TuneBuddy je full-stack aplikacija za povezivanje ljubitelja glazbe, organizaciju odlaska na koncerte i chat s matchanim korisnicima.

## 👥 Team Information

- **Karmen Grubić** - GitHub: [@kagela58](https://github.com/kagela58)
- **Matea Begonja** - GitHub: [@mbegonja](https://github.com/mbegonja)
- **Barbara Jezidžić** - GitHub: [@barbjez](https://github.com/barbjez)
- **Team Name**: KMB

## ✨ Značajke

### 🎯 Osnovne funkcionalnosti
- **Registracija i prijava** - Potpuno funkcionalan auth sistem s JWT tokenima
- **Upravljanje profilom** - Uređivanje imena, bio-a, godina, lokacije, žanrova
- **Upload slike profila** - Lokalni upload s laptopa ili URL link
- **Pregled događaja** - 100+ koncerata i festivala diljem Hrvatske
- **Wishlist** - Označavanje događaja koje želiš posjetiti
- **Pretraživanje** - Filter po gradovima (Zagreb, Split, Rijeka, Dubrovnik, Zadar...), te po datumu događaja i stranici za kupnju karti

### 🚀 Inovativne funkcije
- **AI-Powered Chat** - Chat s matchanim korisnicima, AI automatski generira smislene odgovore
- **Personalizirani Matchevi** - Algoritam rangira korisnike po kompatibilnosti (0-100% score)
- **Personalizirane preporuke događaja** - Eventi filtrirani po tvojim omiljenim žanrovima
- **Preporuke izvođača** - Sugestije novih bendova na temelju tvojih preferencija
- **Match Score prikaz** - Vizualno prikazuje koliko se podudaraš s drugim korisnicima

## 🛠 Tech Stack

### Frontend
- **React 18.3.1** - UI biblioteka
- **TypeScript 5.6.3** - Tipiziran JavaScript
- **Vite 5.4.21** - Build tool
- **Tailwind CSS 3.4.14** - Styling
- **Lucide React** - Ikone
- **React Router DOM 6.30.3** - Navigacija

### Backend
- **Node.js** - Runtime environment
- **Express 4.19.2** - Web framework
- **TypeScript 5.6.3** - Tipiziran backend
- **Better-sqlite3 12.6.2** - Database
- **JWT (jsonwebtoken 9.0.3)** - Autentifikacija
- **bcryptjs 3.0.3** - Password hashing
- **Multer** - File upload middleware
- **ts-node-dev 2.0.0** - Dev server

## 🚀 Instalacija i pokretanje

### Preduvjeti
- Node.js (v18 ili novije)
- npm (v9 ili novije)

### 1. Kloniraj repository
```bash
git clone <repository-url>
cd Tune_Buddy_KMB_projekt_2526
```

### 2. Instaliraj dependencies
```bash
npm install
```

### 3. Pokreni development servere
```bash
npm run dev
```

Ova komanda pokreće oba servera istovremeno:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000

### 4. Build za produkciju
```bash
npm run build
```

## 📂 Struktura projekta

```
Tune_Buddy_KMB_projekt_2526/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/              # API klijent
│   │   │   └── client.ts
│   │   ├── components/       # React komponente
│   │   │   ├── NotificationBell.tsx
│   │   │   └── SideMenu.tsx
│   │   ├── data/             # Mock podaci
│   │   │   └── mock.ts
│   │   ├── hooks/            # Custom hooks
│   │   │   └── useNotifications.ts
│   │   ├── i18n/             # Internacionalizacija
│   │   │   ├── LanguageContext.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   └── translations.ts
│   │   ├── pages/            # Page komponente
│   │   │   ├── Chat.tsx      # Chat s matchevima
│   │   │   ├── Dashboard.tsx # Glavni dashboard
│   │   │   ├── Events.tsx    # Pregled događaja
│   │   │   ├── Favorites.tsx # Omiljeni događaji
│   │   │   ├── Landing.tsx   # Početna stranica
│   │   │   ├── Login.tsx     # Prijava
│   │   │   ├── Profile.tsx   # Profil korisnika
│   │   │   └── Register.tsx  # Registracija
│   │   ├── utils/            # Pomoćne funkcije
│   │   │   └── helpers.ts
│   │   ├── App.tsx           # Glavni app router
│   │   ├── index.css         # Glavni CSS
│   │   ├── main.tsx          # Entry point
│   │   └── types.ts          # TypeScript types
│   ├── index.html
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── auth.ts           # Auth funkcije
│   │   ├── chat.ts           # Chat sistem s AI
│   │   ├── db.ts             # Database inicijalizacija
│   │   ├── events.ts         # Events management
│   │   ├── index.ts          # Express server
│   │   ├── recommendations.ts # Matching i preporuke
│   │   └── types.ts          # TypeScript types
│   ├── uploads/              # Uploaded slike
│   └── package.json
│
├── package.json              # Root package (workspaces)
└── README.md
```

## 🔒 API Endpoints

### Authentication
- `POST /api/auth/register` - Registracija korisnika
- `POST /api/auth/login` - Prijava korisnika

### User Profile
- `GET /api/me` - Dohvat trenutnog korisnika (auth required)
- `PUT /api/profile` - Ažuriranje profila (auth required)
- `DELETE /api/profile` - Brisanje profila (auth required)
- `POST /api/upload` - Upload slike profila (auth required)

### Preferences
- `GET /api/preferences` - Dohvat korisničkih preferencija (auth required)
- `POST /api/preferences` - Spremanje preferencija (auth required)

### Events
- `GET /api/events?location=Zagreb` - Dohvat događaja po lokaciji
- `GET /api/events/recommended` - Personalizirane preporuke (auth required)

### Wishlist
- `GET /api/wishlist` - Dohvat wishlist-a (auth required)
- `POST /api/wishlist/:eventId` - Dodavanje u wishlist (auth required)
- `DELETE /api/wishlist/:eventId` - Uklanjanje iz wishlist-a (auth required)

### Matches & Chat
- `GET /api/matches` - Dohvat matchanih korisnika sa scorom (auth required)
- `GET /api/chat/:matchId` - Dohvat poruka s nekim matchom (auth required)
- `POST /api/chat/:matchId` - Slanje poruke (auth required, AI automatski odgovara)

### Recommendations
- `GET /api/artists/recommended` - Preporuke izvođača (auth required)

## 🎯 Matching Algoritam

Scoring sistem (0-100 bodova):
- **Ista lokacija**: 50 bodova bonus (prioritet za isti grad)
- **Zajednički žanrovi**: 8 bodova po žanru (max ~30)
- **Zajednički izvođači**: 8 bodova po izvođaču (max ~30)

## 📊 Demo podaci

Aplikacija dolazi s:
- **100+ događaja** diljem Hrvatske
- **Razni žanrovi**: Electronic, Indie, Rock, Pop, Classical, Jazz, Hip-Hop, Metal, Funk, R&B, Folk, Turbofolk, Country, Reggae, Latino
- **Poznati izvođači**: Arctic Monkeys, Dua Lipa, Indira Forza, MP Thompson, TBF, AC/DC, Queen, Bon Jovi...
- **Linkovi na ulaznice**: entrio.hr, adriaticket.com, eventim.hr

## 🎨 Design

- **Dark theme** - Moderan tamni dizajn
- **Gradient akcenti** - Lagoon (teal) i Coral (narančasta)
- **Responsive** - Prilagođen za desktop, tablet, mobile
- **Tailwind CSS** - Utility-first CSS framework

## 🔐 Sigurnost

- **JWT tokeni** - Secure autentifikacija
- **bcrypt hashing** - Sigurno čuvanje lozinki
- **File validation** - Provjera tipa i veličine slika (max 5MB)
- **SQL prepared statements** - Zaštita od SQL injection-a

---

**Enjoy using TuneBuddy! 🎵**
