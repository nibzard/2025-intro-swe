# Lab 03 – Carla Bajić

## 📚 BookSeeker — Inteligentna pretraga knjiga

- **Project name:** BookSeeker
- **Autor:** Carla Bajić
- **Kolegij:** Uvod u programsko inženjerstvo
- **Folder:** students/lab03/carla3791/
- **Status:** In Progress
- **Description:** BookSeeker je osobna digitalna knjižnica i inteligentna tražilica knjiga. Korisnik može pretraživati knjige prema sjećanju na radnju, likove ili detalje, dok aplikacija organizira i prati sve odabrane knjige u privatnoj biblioteci.


## ❗Problem  
Čitatelji često pamte nijanse priče (likove, događaje, lokacije) ali ne točan naslov knjige. Tradicionalne tražilice oslanjaju se na precizne ključne riječi, što u tim slučajevima često nije dovoljno i vodi u dugotrajnu i neuspješnu pretragu.

## 💡 Hipoteza  
Omogućimo li semantičko (značenjsko) pretraživanje koristeći AI embedding modele, korisnici će brže i pouzdanije pronaći knjige na temelju opisa, bez potrebe za točnim naslovom ili autorom.

**Hipoteza:** AI-based semantic search > klasično keyword pretraživanje za scenarije „sjećanja na radnju“.

## Features
- Pretraživanje knjiga prema sjećanju na radnju, likove ili detalje
- Organizacija privatne biblioteke: favorites, wishlist, žanrovi
- Automatsko popunjavanje osnovnih podataka o knjigama

## 🛠️Funkcionalnosti (MVP)
- Pretraživanje knjiga po slobodnom opisu (tekstualni upit)
- Privatna biblioteka (favorites, wishlist, žanrovi)
- Embedding-based semantičko podudaranje
- Lako proširiv API (FastAPI)

## Glavne funkcionalnosti

- **Pretraga knjiga po opisu** – unos slobodnog teksta (radnja, likovi, žanr); pretraga koristi Google Books API i Open Library API; rezultati se spajaju i duplikati uklanjaju.
- **Detaljan prikaz knjige** – modal s naslovom, autorima, žanrovima, godinom izdanja i punim sažetkom radnje; zatvaranje klikom izvan prozora, tipkom Escape ili gumbom.
- **Privatna biblioteka** – spremanje pronađenih knjiga u vlastitu kolekciju; pregled, filtriranje po žanru i autoru te pretraga po naslovu/opisu; brisanje knjiga iz biblioteke.
- **Robusno ponašanje** – poruka kada pretraga ne vrati rezultate; fallback rezultati kada je Google Books dnevna kvota iscrpljena; prikaz grešaka i informativnih poruka korisniku.
- **Spremno za objavu** – konfiguracija za produkciju (varijabla okruženja za URL backend-a), dokumentirani koraci za objavu na Renderu i Vercelu te za rad s fork-om i Pull Requestom.

---

## Tehnologije i arhitektura

### Backend (server)

- **Okruženje:** Node.js, Express
- **Jezik:** JavaScript
- **Vanjski API-ji:** Google Books API (pretraga knjiga), Open Library API (pretraga i dohvat opisa)
- **Perzistencija:** JSON datoteka (`server/data/library.json`) za spremanje liste knjiga u biblioteci
- **Konfiguracija:** varijable okruženja u `.env` (npr. `GOOGLE_BOOKS_API_KEY`, `PORT`)

**Glavni moduli i odgovornosti:**

- Express aplikacija s CORS-om i JSON body parserom
- Funkcije za čitanje/pisanje biblioteke (`readLibrary`, `writeLibrary`)
- Normalizacija podataka iz Google Books i Open Library u jedinstveni format knjige
- Rute: `GET /api/search` (pretraga), `GET /api/library` (dohvat s filterima), `POST /api/library` (spremanje), `DELETE /api/library/:id` (brisanje)
- Rukovanje greškama (npr. 429 kvota) i fallback rezultati

### Frontend (client)

- **Okruženje:** React 18, Vite
- **Jezik:** JavaScript (JSX)
- **Stil:** CSS (jedna glavna datoteka, responzivan prikaz)


## Project Diagram - Arhitektura sustava

![BookSeeker Project Diagram](BookSeeker_dijagram.png)

## Struktura projekta

```
BookSeeker/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx         # Glavna logika i komponente
│   │   ├── main.jsx        # Ulazna točka
│   │   └── style.css       # Globalni stilovi
│   ├── index.html
│   ├── vite.config.js      # Proxy /api -> backend
│   └── package.json
├── server/                 # Backend (Node + Express)
│   ├── index.js            # Sve rute i logika
│   ├── data/
│   │   └── library.json    # Spremljene knjige (kreira se automatski)
│   ├── .env.example        # Predložak za .env
│   └── package.json
├── README.md               # Ovaj opis
├── specs.md                # Specifikacija projekta (što i kako)
├── GITHUB_I_OBJAVA.md      # Vodič za objavu online
├── GITHUB_FORK_I_PULL_REQUEST.md  # Vodič za fork i PR
├── KORACI_ZA_POKRETANJE.md # Korak-po-korak pokretanje
└── .gitignore
```

---

## API (backend)

| Metoda | Putanja | Opis |
|--------|---------|------|
| GET | `/api/search?q=<opis>` | Pretraga knjiga po opisu (Google Books + Open Library). Vraća `{ books, query?, count?, message? }`. |
| GET | `/api/library?genre=&author=&search=` | Dohvat knjiga iz biblioteke s opcionalnim filterima. Vraća `{ books, count }`. |
| POST | `/api/library` | Spremanje knjige u biblioteku (tijelo: objekt knjige). Vraća `{ message, book }`. |
| DELETE | `/api/library/:id` | Brisanje knjige iz biblioteke po `id`. |

---

## Pokretanje (lokalno)

### Zahtjevi

- Node.js (npr. LTS verzija)
- (Opcionalno) Google Books API ključ za veći broj pretraga

### Backend

```bash
cd server
npm install
copy .env.example .env   # Windows; na Mac/Linux: cp .env.example .env
# U .env postavi GOOGLE_BOOKS_API_KEY ako ga imaš
npm run dev
```

Server radi na `http://localhost:4000`.

### Frontend

```bash
cd client
npm install
npm run dev
```

Otvori URL koji Vite ispiše (npr. `http://localhost:5173`). Zahtjevi na `/api/*` prosljeđuju se na backend.

---
**Glavne komponente i odgovornosti:**

- **App** – glavna komponenta, tabovi (AI pretraga / Moja biblioteka), toast poruke, pozivi API-ja za spremanje knjige
- **SearchView** – forma za unos opisa, poziv pretrage, prikaz rezultata, poruka kada nema rezultata, gumb „Prikaži opis“ i „Spremi u biblioteku“
- **BookDescriptionModal** – modal s detaljima knjige (naslov, autori, žanrovi, godina, sažetak radnje, link na izvor); zatvaranje Escape tipkom i klikom izvan
- **LibraryView** – dohvat biblioteke, filteri (žanr, autor, pretraga), prikaz kartica knjiga, brisanje, „Prikaži opis“

Pozivi prema backendu koriste zajedničku bazu URL-a (`VITE_API_URL` u produkciji, inače relativni put preko Vite proxyja).

---


## Technologies Used
- [draw.io](https://www.draw.io/), Mermaid
- Python 3
- Git/GitHub
- AI search API 
- Testiranje: **behave** (BDD)  

## 🧪Testiranje (BDD)
Projekt koristi BDD pristup:
- `.feature` datoteke (Gherkin) opisuje očekano ponašanje
- `steps` datoteke implementiraju testove koji pokreću logiku (lokalno ili preko endpointa)
Cilj: definirati očekivano ponašanje iz perspektive korisnika, pa tek onda implementirati kod.


