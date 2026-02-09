# 📄 SPECS.md — BookSeeker (Technical Specification)

## 1. Project Overview
**Project Name & Working Title:** BookSeeker  
**Version / Date:** v1.0.0 – December 2025  
**High-Level Goal:** Web-based or CLI-based book search tool that allows users to semantically search for books based on natural language descriptions. Uses embeddings and a local FAISS vector store for fast and accurate retrieval.  
**Core Value Proposition:** Simplifies book discovery by allowing users to describe books in natural language rather than relying on exact titles or metadata.

---

## 2. Scope & Requirements

### 2.1 Goals (In-Scope)
- Semantic search using sentence embeddings (`sentence-transformers`).  
- Local FAISS index for fast nearest-neighbor retrieval.  
- JSON-based data store for book catalog.  
- REST API using FastAPI (`POST /search` endpoint).  
- Support for multiple query results (`k` parameter).  
- Basic CLI or minimal web UI for demonstration.  
- BDD tests (using `behave`) to validate user scenarios.

### 2.2 Non-Goals (Out-of-Scope)
- Multi-user authentication or profiles.  
- Cloud hosting or database integration beyond local JSON.  
- Full web frontend with rich UX (optional CLI/demo UI only).  
- Recommender system or personalized book suggestions.  

### 2.3 User Personas / Scenarios
**Primary User:** Reader or book enthusiast who wants to quickly find books matching a description.  
**Scenario:** Ana types “a fantasy book with dragons and political intrigue” → BookSeeker returns the closest matches from the local catalog with relevant metadata.

---

## 3. Technical Architecture

### 3.1 Tech Stack & Rationale
- **Language/Runtime:** Python 3.8+ (rapid prototyping, library support).  
- **Web Framework:** FastAPI (lightweight REST API).  
- **Embeddings:** `sentence-transformers` (`all-MiniLM-L6-v2`) for semantic encoding.  
- **Vector Store:** FAISS (efficient similarity search).  
- **Data Storage:** JSON (easy to modify and portable).  
- **Testing:** `behave` BDD framework for functional testing.  
- **Rationale:** Minimal infrastructure, reproducible locally, and scalable for future enhancements.

### 3.2 High-Level Architecture
User (CLI / Web UI)
|
v
FastAPI Endpoint (/search)
|
v
Embeddings Module (sentence-transformers)
|
v
FAISS Vector Store
|
v
JSON Book Catalog

## 4. Project Directory Structure
BookSeeker/
├── app.py # FastAPI application
├── embeddings.py # Embedding generation module
├── search.py # Query & FAISS search logic
├── books.json # Local book catalog
├── requirements.txt # Python dependencies
├── tests/
│ └── features/ # BDD tests
├── README.md
└── SPECS.md

## 5. Interface Specifications

## 5. Interface Specifications

### Web / CLI Interface
- **Input:** Text query describing a book.  
- **Output:** List of top-k books with metadata (title, author, description).  
- **Endpoints:**  

##User Workflows
1.User enters a description.
2.Backend converts description to embedding.
3.FAISS searches nearest book embeddings.
4.Return top-k results to the user.

## 6. Functional Specifications (Module Breakdown)

### Module A – API (`app.py`)
Handles requests, routing, input validation, and response formatting.

### Module B – Embeddings (`embeddings.py`)
Generates vector representations for text.

### Module C – Search (`search.py`)
Performs similarity search using FAISS.

### Module D – Data (`books.json`)
Stores book metadata and embeddings (precomputed).

### Module E – Testing (`tests/`)
BDD tests validating end-to-end functionality.

---

## 7. Development Plan & Milestones

- **Milestone 1:** Project setup, FastAPI skeleton, JSON book catalog. ✅  
- **Milestone 2:** Embeddings and FAISS integration. ✅  
- **Milestone 3:** API endpoint `/search` fully functional. ✅  
- **Milestone 4:** BDD tests implemented, documentation and `SPECS.md` finalized. ✅

---

## 8. Testing & Quality Strategy

### Unit Tests
- Embedding module, search module, API endpoint.

### Integration Tests
- Full query-to-result workflow using BDD.

### Quality Assurance
- Validate top-k results.  
- Error handling for invalid input.  
- Ensure JSON catalog integrity.

---

## 9. Future Improvements (Roadmap)

- Web frontend with richer UI.  
- Integration with external book APIs for larger catalogs.  
- Persistent database storage instead of JSON.  
- Multi-user profiles and personalized recommendations.  
- Dockerized deployment for reproducibility.

---
## 1. Cilj projekta

**Cilj:** Omogućiti korisniku da **pronađe knjigu i kada ne zna njezin naslov** – dovoljno je da opiše sadržaj (radnju, likove, atmosferu, žanr). Pronađene knjige korisnik može spremiti u vlastitu **privatnu biblioteku**, pregledavati ih i filtrirati.

**Zašto “po opisu”?** Česta situacija je da korisnik pamti sadržaj knjige, a ne točan naslov ili autora. Klasična pretraga po naslovu tada ne pomaže. BookSeeker koristi cijeli korisnikov tekst kao upit za pretragu u Google Books i Open Library, koji indeksiraju i opise knjiga, pa se mogu dobiti relevantni rezultati.

---
## 2. Opseg – što je napravljeno

### 2.1 Funkcionalni zahtjevi (realizirano)

- Korisnik može upisati slobodni opis knjige i pokrenuti pretragu.
- Pretraga koristi **dva izvora**: Google Books API i Open Library API; rezultati se spajaju i duplikati (isti naslov + autor) uklanjaju.
- Za svaku knjigu prikazuju se: naslov, autori, žanrovi, kratki opis, naslovnica (ako postoji), link na izvor.
- Korisnik može otvoriti **detaljan prikaz** knjige: modal s punim sažetkom radnje, godinom izdanja i linkom na Google Books / Open Library. Modal se zatvara tipkom Escape, klikom izvan ili gumbom.
- Korisnik može **spremiti** knjigu u “Moja biblioteka” iz rezultata pretrage.
- U “Moja biblioteka” korisnik vidi spremljene knjige, može **filtrirati** po žanru i autoru te **pretraživati** po naslovu/opisu; može **obrisati** knjigu iz biblioteke i također otvoriti detaljan opis.
- Aplikacija prikazuje **poruke korisniku**: kada nema rezultata pretrage, kada je Google kvota iscrpljena (i koristi Open Library / fallback), te u slučaju grešaka.
- Aplikacija je pripremljena za **objavu online**: frontend koristi varijablu okruženja za URL backend-a; u repozitoriju postoje vodiči za deploy (Render, Vercel) i za rad s fork-om i Pull Requestom.

### 2.2 Što nije uključeno (namjerno ili za kasnije)

- **Registracija / prijava** – trenutno postoji jedna “biblioteka” po instalaciji (jedan `library.json`). Moguća buduća nadogradnja: korisnički računi i privatna biblioteka po korisniku.
- **Baza podataka** – biblioteka se sprema u JSON datoteku na serveru. Za školski projekt i manji broj korisnika to je dovoljno; za produkciju s više korisnika trebalo bi uvesti bazu (npr. SQLite ili PostgreSQL).
- **Napredni AI** – nema LLM-a (npr. OpenAI) koji bi iz opisa izvlačio ključne riječi ili predlagao naslove; pretraga koristi korisnikov tekst izravno kao upit prema Google Books i Open Library.

---

## 3. Arhitektura i tehnologije

### 3.1 Odluka: klijent–server

- **Frontend:** React (Vite) – SPA koja komunicira s backendom putem REST API-ja.
- **Backend:** Node.js + Express – rukuje zahtjevima, poziva vanjske API-je, čita/piše biblioteku.

Razlog: jasna podjela odgovornosti, jednostavno testiranje backend ruta, mogućnost kasnijeg dodavanja autentikacije ili drugih servisa.

### 3.2 Backend – što je korišteno i zašto

- **Express** – jednostavan i dovoljan za REST API.
- **axios** – HTTP klijent za pozive prema Google Books i Open Library.
- **dotenv** – učitavanje `GOOGLE_BOOKS_API_KEY` i `PORT` iz `.env`.
- **cors** – omogućavanje poziva s frontenda (drugi port ili drugi domen u produkciji).
- **fs** – čitanje i pisanje `library.json` (nema baze).

Podatak knjige (nakon normalizacije) ima polja: `id`, `title`, `authors`, `description`, `categories`, `thumbnail`, `infoLink`, `publishedDate`, `language`. Istovjetan format koristi se za rezultate pretrage i za spremljene knjige u biblioteci.

### 3.3 Frontend – što je korišteno i zašto

- **React** – komponentni pristup, jednostavno stanje (useState) za forme, rezultate, modal i filtere.
- **Vite** – brzi dev server i build; proxy za `/api` prema backendu u razvoju.
- **Jedna glavna datoteka (App.jsx)** – sve glavne komponente (SearchView, LibraryView, BookDescriptionModal) u jednoj datoteci kako bi projekt ostao pregledan bez složene strukture mapa.
- **CSS u jednoj datoteci** – globalni stilovi, tamna tema, responzivni raspored (npr. kartice knjiga u stupac na uskim ekranima).

### 3.4 Vanjski API-ji

- **Google Books API** (`/volumes?q=...`) – pretraga po upitu; vraća naslove, autore, opise (često kraće), naslovnice, linkove. Opcionalno zahtijeva API ključ; bez ključa ima strožu dnevnu kvotu.
- **Open Library** – `search.json?q=...` za pretragu; za svaki rezultat (work) dohvaća se `.../works/<id>.json` radi **dužeg opisa** radnje. Time se nadoknađuju kraći opisi s Googlea i pruža korisniku “Goodreads-style” sažetak.

Odluka o dva izvora: veći broj rezultata, manja ovisnost o jednom servisu (npr. kad je Google kvota iscrpljena, Open Library i dalje može vratiti rezultate), te često bolji (duži) opisi s Open Librarya.

---

## 4. Protok podataka i korisnički tok

1. Korisnik upisuje opis u “AI pretraga” i šalje formu.
2. Frontend šalje `GET /api/search?q=...` na backend.
3. Backend paralelno (ili uzastopno) zove Google Books i Open Library; za Open Library za prvih N rezultata dohvaća opise radova; normalizira podatke i spaja ih u jednu listu bez duplikata; vraća `{ books }`.
4. Frontend prikazuje listu; korisnik može kliknuti “Prikaži opis” (otvara se modal s punim sažetkom) ili “Spremi u biblioteku”.
5. “Spremi u biblioteku” šalje `POST /api/library` s objektom knjige. Backend dodaje knjigu u `library.json` (ako već ne postoji po `id`) i vraća potvrdu.
6. U “Moja biblioteka” frontend šalje `GET /api/library` (s opcionalnim `genre`, `author`, `search`). Backend čita `library.json`, filtrira i vraća listu. Korisnik može filtrirati, pretraživati, brisati knjige (`DELETE /api/library/:id`) i otvarati detaljan opis.

---

## 5. Struktura datoteka i odgovornosti

| Datoteka / mapa | Odgovornost |
|-----------------|-------------|
| `server/index.js` | Express app, rute, normalizacija, pozivi Google/Open Library, čitanje/pisanje `library.json`, rukovanje greškama (npr. 429) i fallback. |
| `server/data/library.json` | Jedna “biblioteka” – niz knjiga; kreira se automatski ako ne postoji. |
| `server/.env` | `GOOGLE_BOOKS_API_KEY`, `PORT` (nije u repozitoriju). |
| `client/src/App.jsx` | Komponente SearchView, LibraryView, BookDescriptionModal; stanje (query, results, books, filteri, selectedBook); svi `fetch` pozivi prema API-ju; Escape za modal. |
| `client/src/style.css` | Stilovi za layout, kartice, modal, forme, poruke, responzivnost. |
| `client/vite.config.js` | Proxy `/api` na `localhost:4000` u developmentu. |
| `README.md` | Opis aplikacije, tehnologije, struktura, API, upute za pokretanje i poveznice na ostalu dokumentaciju. |
| `specs.md` | Ovaj dokument – specifikacija: cilj, opseg, arhitektura, tok podataka, odluke. |

---

## 6. Odluke i kompromisi

- **Jedan `library.json`** – jednostavno za razvoj i predaju; za više korisnika trebalo bi razdvojiti podatke po korisniku (npr. nakon uvođenja prijave).
- **Bez baze** – namjerno korištenje datoteke kako projekt ostane jasan i bez dodatnih servisa; profesor može pokrenuti samo `npm install` i `npm run dev` u `server` i `client`.
- **Open Library opisi u backendu** – dohvat opisa za prvih N rezultata povećava vrijeme odgovora za nekoliko sekundi, ali korisnik dobiva duže opise bez dodatnog klika; za školski projekt prihvatljivo.
- **Fallback knjige (Harry Potter, LOTR)** – kad je Google kvota iscrpljena i nema drugih rezultata, korisnik i dalje vidi nešto umjesto praznog ekrana; u kombinaciji s Open Library-om često ima i “prave” rezultate.
- **Nema prijave** – projekt je predan kao funkcionalna verzija s jednom bibliotekom; prijava i privatni računi ostaju kao moguća nadogradnja (dokumentirano u README-u).

---

## 7. Kako pokrenuti i pregledati

- **Lokalno:** vidi [README.md](./README.md), odjeljak “Pokretanje (lokalno)”. Ukratko: `server` – `npm install`, `.env`, `npm run dev`; `client` – `npm install`, `npm run dev`; otvoriti npr. `http://localhost:5173`.
- **Online:** vodič za Render (backend) i Vercel (frontend) te varijablu `VITE_API_URL`: [GITHUB_I_OBJAVA.md](./GITHUB_I_OBJAVA.md).
- **Fork i PR:** kako raditi na fork-u i poslati Pull Request: [GITHUB_FORK_I_PULL_REQUEST.md](./GITHUB_FORK_I_PULL_REQUEST.md).

---

## 8. Sažetak za pregledavatelja

- **Što je napravljeno:** Web aplikacija za pretragu knjiga po opisu (Google Books + Open Library), privatna biblioteka (spremanje, filtriranje, brisanje), detaljan prikaz knjige s sažetkom radnje, poruke korisniku i priprema za objavu.
- **Kako je napravljeno:** Backend u Node.js/Express (API, vanjski pozivi, JSON datoteka); frontend u React/Vite (komponente, stanje, pozivi API-ja); dokumentacija u README, specs, vodičima za deploy i fork/PR.
- **Zašto ovako:** Jednostavna arhitektura pogodna za predaju i kasniju nadogradnju; dva izvora podataka za bolje rezultate i opise; bez baze i prijave kako bi fokus bio na funkcionalnosti pretrage i biblioteke.

