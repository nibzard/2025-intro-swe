# 🎼 Inženjerska Specifikacija: Melodia - Music Matcher (FINALNA VERZIJA)

## 1. Project Overview

**Project Name & Working Title:** Melodia - Music Matcher

**Version / Date:** v0.2.0 (s lokacijom) / Prosinac 2025

**High-Level Goal:** Mobilna aplikacija za spajanje koja korisnicima omogućuje pronalazak **prijatelja** na temelju **glazbenih preferencija (Spotify) i geografske blizine (Google Maps)**. Cilj je olakšati organizaciju druženja za slušanje glazbe uživo.

**Core Value Proposition:** Rješava problem pronalaska ljudi sa sličnim glazbenim ukusima **u neposrednoj blizini**, omogućujući korisnicima da vide svoje *Music Buddies* na karti.

---
## 2. Scope & Requirements

### 2.1 Goals (In-Scope)

* **Spotify Povezivanje:** Dohvat Top Artists, Top Songs i Žanrova.
* **Match Algoritam:** Izračun postotka podudarnosti na temelju pjesama i žanrova.
* **Geolokacija:** Dohvat i pohrana `Latitude/Longitude` lokacije korisnika.
* **Prikaz na Google Maps:** Interaktivna karta koja prikazuje markere podudarnih korisnika.
* **Filtriranje:** Filtriranje podudarnosti po minimalnom `Match Score` i maksimalnom **radijusu udaljenosti**.
* **Friend Request:** Implementacija slanja i primanja zahtjeva za prijateljstvo.

### 2.2 Non-Goals (Out-of-Scope)

* Nema Live Chat sustava u MVP-u (korisnici koriste vanjske aplikacije za chat).
* Nema multi-user autentifikacije (samo single-user registracija/prijava).
* Nema **biometrijske autentifikacije** (Face ID/otisak prsta).
* Nema sinkronizacije s drugim glazbenim servisima (npr. Apple Music).

### 2.3 User Personas / Scenarios

**Marko (22, Student):** Marko je student u novom gradu. Otvara Melodiju, poveže Spotify. Aplikacija mu prikazuje ljude na Google Karti. Marko vidi **4 markera** unutar 3km. Jedan ima 95% podudarnosti. Šalje mu zahtjev za prijateljstvo i dogovaraju prvu kavu.

---
## 3. Technical Architecture

### 3.1 Tech Stack & Rationale

| Komponenta | Tehnologija | Racionalno objašnjenje |
| :--- | :--- | :--- |
| **Frontend/Mobile** | **React Native** | Osnovni izbor za mobilne aplikacije; brz razvoj i jednostavna integracija **geolokacije** i **Google Maps API-ja**. |
| **Backend API** | **Python 3.11+, FastAPI** | Izvrstan za **algoritme podudarnosti** i API endpoints, poznat po performansama i jednostavnosti. |
| **Baza podataka** | **PostgreSQL** | Pouzdana relacijska baza, idealna za pohranu korisničkih odnosa i podržava geografske (spatial) upite (PostGIS) za buduće proširenje. |
| **Ključni API** | **Spotify Web API**, **Google Maps API** | Standardni alati za domenu i funkcionalnost karte. |

### 3.2 High-Level Architecture

Sustav se sastoji od tri ključna sloja (Frontend, API, DB) i dvije vanjske integracije (Spotify, Google Maps).

```
Mobile App (React Native)
  |
# Kreira mapu projekta (ako već ne postoji)
mkdir -p projects/Melodia-bvuksicc

# Koristi 'cat' za pisanje kompletnog teksta specifikacije u datoteku
cat << EOF > projects/Melodia-bvuksicc/Specification.md
# 🎼 Inženjerska Specifikacija: Melodia - Music Matcher (FINALNA VERZIJA)

## 1. Project Overview

**Project Name & Working Title:** Melodia - Music Matcher

**Version / Date:** v0.2.0 (s lokacijom) / Prosinac 2025

**High-Level Goal:** Mobilna aplikacija za spajanje koja korisnicima omogućuje pronalazak **prijatelja** na temelju **glazbenih preferencija (Spotify) i geografske blizine (Google Maps)**. Cilj je olakšati organizaciju druženja za slušanje glazbe uživo.

**Core Value Proposition:** Rješava problem pronalaska ljudi sa sličnim glazbenim ukusima **u neposrednoj blizini**, omogućujući korisnicima da vide svoje *Music Buddies* na karti.

---
## 2. Scope & Requirements

### 2.1 Goals (In-Scope)

* **Spotify Povezivanje:** Dohvat Top Artists, Top Songs i Žanrova.
* **Match Algoritam:** Izračun postotka podudarnosti na temelju pjesama i žanrova.
* **Geolokacija:** Dohvat i pohrana `Latitude/Longitude` lokacije korisnika.
* **Prikaz na Google Maps:** Interaktivna karta koja prikazuje markere podudarnih korisnika.
* **Filtriranje:** Filtriranje podudarnosti po minimalnom `Match Score` i maksimalnom **radijusu udaljenosti**.
* **Friend Request:** Implementacija slanja i primanja zahtjeva za prijateljstvo.

### 2.2 Non-Goals (Out-of-Scope)

* Nema Live Chat sustava u MVP-u (korisnici koriste vanjske aplikacije za chat).
* Nema multi-user autentifikacije (samo single-user registracija/prijava).
* Nema **biometrijske autentifikacije** (Face ID/otisak prsta).
* Nema sinkronizacije s drugim glazbenim servisima (npr. Apple Music).

### 2.3 User Personas / Scenarios

**Marko (22, Student):** Marko je student u novom gradu. Otvara Melodiju, poveže Spotify. Aplikacija mu prikazuje ljude na Google Karti. Marko vidi **4 markera** unutar 3km. Jedan ima 95% podudarnosti. Šalje mu zahtjev za prijateljstvo i dogovaraju prvu kavu.

---
## 3. Technical Architecture

### 3.1 Tech Stack & Rationale

| Komponenta | Tehnologija | Racionalno objašnjenje |
| :--- | :--- | :--- |
| **Frontend/Mobile** | **React Native** | Osnovni izbor za mobilne aplikacije; brz razvoj i jednostavna integracija **geolokacije** i **Google Maps API-ja**. |
| **Backend API** | **Python 3.11+, FastAPI** | Izvrstan za **algoritme podudarnosti** i API endpoints, poznat po performansama i jednostavnosti. |
| **Baza podataka** | **PostgreSQL** | Pouzdana relacijska baza, idealna za pohranu korisničkih odnosa i podržava geografske (spatial) upite (PostGIS) za buduće proširenje. |
| **Ključni API** | **Spotify Web API**, **Google Maps API** | Standardni alati za domenu i funkcionalnost karte. |

### 3.2 High-Level Architecture

Sustav se sastoji od tri ključna sloja (Frontend, API, DB) i dvije vanjske integracije (Spotify, Google Maps).

```
Mobile App (React Native)
  |
  +-- (Lokacija, Prikaz Karte) --> Google Maps API
  |
  +-- (REST API Pozivi) --> FastAPI Backend
                                  |
                                  +-- (Dohvat glazbe) --> Spotify API
                                  |
                                  +-- (Pohrana/Dohvat) --> PostgreSQL DB
```

### 3.3 Project Directory Structure

```
Melodia-bvuksicc/
  ├── app-mobile/             # React Native frontend (UI/Maps)
  │   ├── src/
  │   └── components/
  ├── api-server/             # Python/FastAPI backend
  │   ├── app/
  │   │   ├── api/            # Endpoints (users, map, friends)
  │   │   └── core/           # Matching and Proximity algorithm logic
  │   └── requirements.txt
  └── README.md
```

---
## 4. Data Design (The Domain Model)


# Kreira mapu projekta (ako već ne postoji)
mkdir -p projects/Melodia-bvuksicc

# Koristi 'cat' za pisanje kompletnog teksta specifikacije u datoteku
cat << EOF > projects/Melodia-bvuksicc/Specification.md
# 🎼 Inženjerska Specifikacija: Melodia - Music Matcher (FINALNA VERZIJA)

## 1. Project Overview

**Project Name & Working Title:** Melodia - Music Matcher

**Version / Date:** v0.2.0 (s lokacijom) / Prosinac 2025

**High-Level Goal:** Mobilna aplikacija za spajanje koja korisnicima omogućuje pronalazak **prijatelja** na temelju **glazbenih preferencija (Spotify) i geografske blizine (Google Maps)**. Cilj je olakšati organizaciju druženja za slušanje glazbe uživo.

**Core Value Proposition:** Rješava problem pronalaska ljudi sa sličnim glazbenim ukusima **u neposrednoj blizini**, omogućujući korisnicima da vide svoje *Music Buddies* na karti.

---
## 2. Scope & Requirements

### 2.1 Goals (In-Scope)

* **Spotify Povezivanje:** Dohvat Top Artists, Top Songs i Žanrova.
* **Match Algoritam:** Izračun postotka podudarnosti na temelju pjesama i žanrova.
* **Geolokacija:** Dohvat i pohrana `Latitude/Longitude` lokacije korisnika.
* **Prikaz na Google Maps:** Interaktivna karta koja prikazuje markere podudarnih korisnika.
* **Filtriranje:** Filtriranje podudarnosti po minimalnom `Match Score` i maksimalnom **radijusu udaljenosti**.
* **Friend Request:** Implementacija slanja i primanja zahtjeva za prijateljstvo.

### 2.2 Non-Goals (Out-of-Scope)

* Nema Live Chat sustava u MVP-u (korisnici koriste vanjske aplikacije za chat).
* Nema multi-user autentifikacije (samo single-user registracija/prijava).
* Nema **biometrijske autentifikacije** (Face ID/otisak prsta).
* Nema sinkronizacije s drugim glazbenim servisima (npr. Apple Music).

### 2.3 User Personas / Scenarios

**Marko (22, Student):** Marko je student u novom gradu. Otvara Melodiju, poveže Spotify. Aplikacija mu prikazuje ljude na Google Karti. Marko vidi **4 markera** unutar 3km. Jedan ima 95% podudarnosti. Šalje mu zahtjev za prijateljstvo i dogovaraju prvu kavu.

---
## 3. Technical Architecture

### 3.1 Tech Stack & Rationale

| Komponenta | Tehnologija | Racionalno objašnjenje |
| :--- | :--- | :--- |
| **Frontend/Mobile** | **React Native** | Osnovni izbor za mobilne aplikacije; brz razvoj i jednostavna integracija **geolokacije** i **Google Maps API-ja**. |
| **Backend API** | **Python 3.11+, FastAPI** | Izvrstan za **algoritme podudarnosti** i API endpoints, poznat po performansama i jednostavnosti. |
| **Baza podataka** | **PostgreSQL** | Pouzdana relacijska baza, idealna za pohranu korisničkih odnosa i podržava geografske (spatial) upite (PostGIS) za buduće proširenje. |
| **Ključni API** | **Spotify Web API**, **Google Maps API** | Standardni alati za domenu i funkcionalnost karte. |

### 3.2 High-Level Architecture

Sustav se sastoji od tri ključna sloja (Frontend, API, DB) i dvije vanjske integracije (Spotify, Google Maps).

```
Mobile App (React Native)
  |
  +-- (Lokacija, Prikaz Karte) --> Google Maps API
  |
  +-- (REST API Pozivi) --> FastAPI Backend
                                  |
                                  +-- (Dohvat glazbe) --> Spotify API
                                  |
                                  +-- (Pohrana/Dohvat) --> PostgreSQL DB
```

### 3.3 Project Directory Structure

```
Melodia-bvuksicc/
  ├── app-mobile/             # React Native frontend (UI/Maps)
  │   ├── src/
  │   └── components/
  ├── api-server/             # Python/FastAPI backend
  │   ├── app/
  │   │   ├── api/            # Endpoints (users, map, friends)
  │   │   └── core/           # Matching and Proximity algorithm logic
  │   └── requirements.txt
  └── README.md
```

---
## 4. Data Design (The Domain Model)

### Core Entities

1.  **User:** (ID, ime, e-mail, lozinka, **Latitude, Longitude**)
2.  **MusicProfile:** (User ID, **Spotify Top Songs ID-jevi**, **Spotify Žanrovi**)
3.  **FriendRequest:** (Pošiljatelj ID, Primatelj ID, Status, `match_score`)

### Schema / Data Structure

* **Users Table:** Mora sadržavati **`latitude`** i **`longitude`** (Numeric/Float) polja za prikaz na karti.
* **MusicProfiles Table:** Koristi JSONB tip podataka za pohranu lista Top Songs i Žanrova.

**Storage Strategy:** Ažuriranje `latitude` i `longitude` u `Users` tablici kad god korisnik odobri lokaciju.

---
## 5. Interface Specifications (A. If Building an API / Web App)

### Endpoints (REST API)

| Metoda | Endpoint | Opis |
| :--- | :--- | :--- |
| `POST` | `/api/users/login` | Prijava i izdavanje JWT tokena. |
| `POST` | `/api/location/update` | Ažurira korisničku lokaciju (`lat`, `lng`). |
| `GET` | `/api/map/nearby` | **Glavni endpoint!** Dohvaća listu podudarnih profila filtriranih po glazbenoj kompatibilnosti i geografskoj udaljenosti. |
| `POST` | `/api/friends/request` | Slanje zahtjeva za prijateljstvo. |

---
## 6. Functional Specifications (Module breakdown)

### Module A (Location Service)
* **Logic:** Dohvat geolokacijskih koordinata putem React Native API-ja. Ažuriranje koordinata u DB-u samo ako postoji značajna promjena lokacije (> 50 metara).

### Module B (Matching & Proximity Engine)
* **Glavna Logika:**
    1.  Izračunava se **Glazbeni Match Score** (Presjek Pjesama + Žanrova).
    2.  Izračunava se **Geografska Udaljenost** (Haversine formula).
    3.  **Filtriranje:** Vraća se samo lista korisnika koji zadovoljavaju **oba uvjeta**: `Match Score` > 50% **I** `Udaljenost` < Odabrani Radijus.

### Module C (Friend Request)
* **Logic:** Rukuje statusima: `Pending`, `Accepted` (prijatelji) i `Rejected`.

---
## 7. Development Plan & Milestones

**Milestone 1 (Skeleton & Auth):**
* Postavljanje React Native i FastAPI projekata.
* Radna Registracija/Prijava i stabilna veza s DB-om.
* Implementacija **Spotify API** integracije.

**Milestone 2 (Core Logic & Data):**
* Implementacija **Matching Engine** algoritma.
* Implementacija **Geolokacijskog modula**.

**Milestone 3 (Map UI & Filtering):**
* Implementacija **Google Maps** komponente i **prikaza markera**.
* Implementacija API rute `/api/map/nearby` s dvostrukim filtriranjem.
* Implementacija **Friend Request** sustava.

**Definition of Done:**
* Korisnik se može prijaviti, povezati Spotify i **ažurirati lokaciju**.
* Aplikacija točno izračunava i prikazuje podudarne profile na **interaktivnoj karti**.
* Slanje i primanje zahtjeva za prijateljstvo je funkcionalno.

---
## 8. Testing & Quality Strategy

**Unit Tests:**
* **Matching Engine Tests:** Testiranje algoritma podudarnosti za rubne slučajeve (npr., nulta podudarnost, 100% podudarnost).
* **Proximity Tests:** Testiranje Haversine formule za izračun udaljenosti.

**Integration Tests:**
* **Full Flow Test:** Testiranje cijele staze: `POST /login` -> `POST /location/update` -> `GET /map/nearby` (mora vratiti profile).

**Fixtures:**
* Kreiranje **20 lažnih profila** u DB-u s **različitim Lat/Lng koordinatama** i **Spotify Top listama**.

**Performance Targets:**
* Vrijeme odziva `GET /api/map/nearby` mora biti **ispod 1 sekunde**.

---
## 9. Future Improvements (Roadmap)

* **Real-time Obavijesti:** Implementacija WebSocketsa za trenutne obavijesti.
* **Sličnost žanrova:** Napredna procjena sličnosti žanrova (ne samo presjek).
* **Event Discover:** Mogućnost pronalaska ljudi koji idu na iste koncerte.
