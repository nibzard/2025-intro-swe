# Studentski Forum -- Tehnička Specifikacija (MVP)

## 1. Project Overview

**Naziv:** Studentski Forum\
**Verzija:** v0.1.0

**Visoka razina:**\
Jednostavna web aplikacija koja studentima omogućuje stvaranje i
komentiranje tema vezanih uz hrvatska sveučilišta.

**Vrijednost:**\
Središnje mjesto za studentske rasprave, strukturirano oko fakulteta,
studija i studentskog života.

## 2. Scope & Requirements

### 2.1 Goals (In-Scope)

-   Registracija i prijava korisnika.
-   Pregled foruma i kategorija.
-   Kreiranje tema i odgovora.
-   Uređivanje i brisanje vlastitih objava.
-   Jednostavna administracija.(nema moderatora nego admin/i).
-   shadcn/ui sučelje.

### 2.2 Non-Goals

-   Nema real-time feedova.
-   Nema privatnih poruka.
-   Nema uploadanja slika.
-   Nema napredne moderacije.
-   Nema mobilne aplikacije.

### 2.3 User Personas

**Student:** pretražuje teme i sudjeluje u raspravama.\
**Admin:** uklanja neprimjeren sadržaj. Upravlja bazom.

## 3. Technical Architecture

### 3.1 Tech Stack

-   **Frontend:** React + Vite
-   **UI:** shadcn/ui
-   **Backend:** Fastify (Node.js)
-   **Auth:** JWT
-   **Database:** SQLite
-   **ORM:** Drizzle ORM

### 3.2 High-Level Architecture

Frontend ⇅ REST API ⇅ SQLite

### 3.3 Directory Structure

    studentski-forum/
      ├── frontend/
      ├── backend/
      ├── README.md
      └── scripts/

## 4. Data Design

### Entities

-   User | Korisnik
-   Category | Kategorija ili tema
-   Thread | Dretva
-   Post | Objava

### Schema

**Users**

    id PK
    email TEXT UNIQUE
    password_hash TEXT
    created_at DATETIME

**Categories**

    id PK
    name TEXT
    description TEXT

**Threads**

    id PK
    category_id FK
    title TEXT
    author_id FK
    created_at DATETIME
    -- bool za deleted/censored (možda)

**Posts**

    id PK
    thread_id FK
    author_id FK
    content TEXT
    created_at DATETIME

## 5. API Specification

### Auth

-   POST /api/auth/register
-   POST /api/auth/login

### Categories

-   GET /api/categories

### Threads

-   GET /api/categories/:id/threads
-   POST /api/categories/:id/threads
-   GET /api/threads/:id

### Posts

-   POST /api/threads/:id/posts
-   PUT /api/posts/:id
-   DELETE /api/posts/:id

## 6. Functional Modules

### Auth

Hashiranje lozinki, JWT tokeni.

### Forum Core

Klasični CRUD za kategorije, teme, postove.

### Admin

Brisanje sadržaja. Upravljanje temama i računima.

### UI

Minimalističko sučelje preko shadcn/ui.

## 7. Development Plan

### Milestones

-   M1: projektna struktura
-   M2: backend jezgra
-   M3: frontend MVP
-   M4: završna poliranja

### Definition of Done

-   Stabilni CRUD tokovi
-   Pouzdana autentikacija
-   Čitljiv UI
-   Osnovni testovi

## 8. Testing

-   Unit testovi backend logike
-   Integration testovi API ruta
-   Fixture: testni korisnici, kategorije, teme, postovi

## 9. Future Improvements

-   Pretraživanje
-   Notifikacije(PWA)
-   Upload slika(profilne i objavne)
-   Glasanje i oznake
