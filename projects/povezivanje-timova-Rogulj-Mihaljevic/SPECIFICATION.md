📄 Engineering Specification – TeamConnect
1. Project Overview

Project Name & Working Title: TeamConnect – Sports Team Finder
Version / Date: v1.0.0 – December 2025
High-Level Goal:
TeamConnect je web aplikacija koja omogućuje korisnicima brzo pronalaženje suigrača i sportskih timova prema sportu i lokaciji (npr. Split – kvartovi). Sustav automatizira spajanje korisnika u postojeće timove ili kreira nove timove kada prethodni nemaju dovoljno članova.

Core Value Proposition:
Rješava čest problem rekreativaca: "Želim igrati, ali nemam ekipu."
TeamConnect uklanja ručno traženje suigrača i čini organizaciju sportskih aktivnosti jednostavnijom.

2. Scope & Requirements
2.1 Goals (In-Scope)

Registracija korisnika

Prijava korisnika

Odabir sporta i lokacije

Prikaz dostupnih timova prema sportu i kvartovima

Automatsko spajanje korisnika u postojeći tim

Kreiranje novog tima ako nema slobodnog

Upravljanje korisničkim profilom (sport, lokacija)

Pohrana korisnika i timova u MongoDB (ili JSON za MVP)

2.2 Non-Goals (Out-of-Scope)

Nema više korisničkih rola (admin, mod, sl.)

Nema notifikacija ili chata

Nema geolokacijskih mapa

Nema mobilne aplikacije

Nema integracije s društvenim mrežama

Nema kalendara ili zakazivanja termina

Nema cross-device sync

Nema rating sustava korisnika

2.3 User Personas / Scenarios

Persona:
Marko, 22, student iz Splita koji želi igrati nogomet na Sućidru, ali nema ekipu.

Scenario:
Marko otvara TeamConnect, prijavi se, odabere nogomet i lokaciju. Aplikacija mu prikazuje timove u blizini. Ako nema dostupnih, automatski mu formira novi tim i dodaje ga kao prvog člana.

3. Technical Architecture
3.1 Tech Stack & Rationale

Frontend: HTML, CSS, JavaScript
Backend: Node.js + Express
Database: MongoDB (preferirano) ili JSON datoteke
Tools: Git, GitHub, VS Code, Postman

Rationale:
Jednostavan stack idealan za studentski tim, lagan za razvoj, testiranje i održavanje.

3.2 High-Level Architecture
┌─────────────────────────┐
│     Frontend (JS)       │
│  UI: Login, Teams, etc  │
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────┐
│   Express REST API      │
│ Routes: users, teams    │
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────┐
│  MongoDB / JSON Storage │
│  Users, Teams           │
└─────────────────────────┘

3.3 Project Directory Structure
teamconnect/
  ├── server.js
  ├── routes/
  │     ├── users.js
  │     └── teams.js
  ├── controllers/
  │     ├── userController.js
  │     └── teamController.js
  ├── models/
  │     ├── User.js
  │     └── Team.js
  ├── public/
  │     ├── index.html
  │     ├── styles.css
  │     └── app.js
  ├── data/            # JSON storage for MVP
  │     ├── users.json
  │     └── teams.json
  ├── package.json
  ├── README.md
  └── SPECIFICATION.md

4. Data Design (Domain Model)
Core Entities

User

Team

Sport (enum)

Location (enum)

MongoDB Schemas
User
{
  "userId": "ObjectId",
  "name": "Karolina",
  "email": "karolina@example.com",
  "password": "hashed",
  "sport": "Nogomet",
  "location": "Split - Brda"
}

Team
{
  "teamId": "ObjectId",
  "sport": "Nogomet",
  "location": "Split - Brda",
  "members": ["ObjectId1", "ObjectId2"],
  "maxPlayers": 10
}

Storage Strategy

MongoDB kolekcije: users, teams

JSON fallback: data/users.json, data/teams.json

5. Interface Specifications
5.1 Web Interface

Pages:

Login / Registration

Dashboard (Odabir sporta + lokacije)

Team Browser (pregled dostupnih timova)

Profile Page

Components:

Forms

Dropdowns

Team cards

Profile editor

5.2 REST API Specification
POST /api/register
{
  "name": "Đana",
  "email": "dana@example.com",
  "password": "123456",
  "sport": "Nogomet",
  "location": "Split - Sućidar"
}

POST /api/login
GET /api/teams?sport=Nogomet&location=Brda
POST /api/team/auto-join
POST /api/team/join
6. Functional Specifications
Module A – Authentication

Registracija (hash lozinke)

Login (provjera email + lozinka)

Module B – Team Matching

Pronađi sve timove za sport+lokaciju

Ako tim ima mjesto → pridruži korisnika

Ako nema → kreiraj novi tim

Module C – Team Management

Pregled timova

Dodavanje člana tima

Kreiranje novog tima

Module D – User Profile Management

Promjena sporta

Promjena lokacije

7. Development Plan & Milestones
Milestone 1 – Setup

✔ npm projekt + Express inicijaliziran
✔ API skeleton

Milestone 2 – Backend Logic

✔ User routes
✔ Team routes
✔ Matching algoritam

Milestone 3 – Frontend

✔ Login/Registration UI
✔ Teams browser
✔ Profile page

Milestone 4 – Integration & Polish

✔ Spojiti backend + frontend
✔ Validacija
✔ Dokumentacija

Definition of Done

Sve rute rade

UI prikazuje stvarne podatke

Matching algoritam testiran

SPECIFICATION.md napisan

8. Testing & Quality Strategy
Unit Tests (preporučeno)

User creation

Team creation

Matching logic

Integration Tests

Registracija → login → auto-join flow

Team listing

Performance

Ograničiti broj timova u upitu

Validirati inpute prije spremanja

9. Future Improvements (Roadmap)

Chat unutar tima

Kalendar termina

Rating sustav igrača

Geolokacija (Google Maps)

Mobile app (React Native)

💡 Implementation Notes
Strengths

Jednostavan i skalabilan stack

Jasne domenske entitete

Laka nadogradnja u budućnosti

Weaknesses

Nema napredne autentikacije

Nema offline podrške

Nema notifikacija

Deployment

Backend: Render / Railway

Frontend: Netlify / GitHub Pages

Baza: MongoDB Atlas