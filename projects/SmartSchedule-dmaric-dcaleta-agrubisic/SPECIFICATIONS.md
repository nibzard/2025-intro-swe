# SmartSchedule – Projektne Specifikacije

## 1. Project Overview
**Project Name:** SmartSchedule  
**Version:** v0.1.0 Baseline  
**Kratki opis:** SmartSchedule je fleksibilna aplikacija za izradu rasporeda, namijenjena i poslovnim korisnicima (poslodavci, radnici) i privatnim korisnicima (prijateljske grupe, obitelji). Sustav omogućava izradu rasporeda, dodavanje osoba, definiranje uvjeta i korištenje AI modulacije za kreiranje optimalnog rasporeda.

**Core Value Proposition:** Pomaže korisnicima u povezivanju obveza, radnih smjena ili slobodnog vremena, stvarajući automatizirane rasporede koji uzimaju u obzir zadane uvjete i potrebe.

---

## 2. Scope & Requirements
### 2.1 Goals (In-Scope)
- Jednostavno i intuitivno korisničko sučelje.
- Mogućnost izrade poslovnih i osobnih rasporeda.
- Dodavanje osoba, radnika ili sudionika.
- Mogućnost definiranja posebnih uvjeta (radno vrijeme, smjene, slobodno vrijeme, dostupnost).
- Generiranje rasporeda uz pomoć AI analize.
- Mogućnost predpregleda i uređivanja generiranog rasporeda.
- Generiranje šifre (koda) za pristup rasporedu zaposlenika ili sudionika.
<<<<<<< HEAD

### 2.2 Non-Goals (Out-of- Scope)
- Aplikacija ne čuva povijest svih izrađenih rasporeda.
- Ne postoji trajna autentifikacija/registracija korisničkih profila (osim poslovnog unosa podataka poslodavca).
- Nakon finalnog spremanja raspored se više ne može uređivati.
- Nema sinkronizacije u realnom vremenu između više uređaja.
=======
- Mogućnost prijave/registracije.

### 2.2 Non-Goals (Out-of- Scope)
- Nije moguća izrada u osobne svrhe.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42

### 2.3 User Personas / Scenarios
- **Poslodavac**: Unosi podatke o tvrtki, radnicima i radnim uvjetima. Nakon izrade rasporeda, zaposlenici pristupaju uz generiranu šifru.
- **Radnik**: Prijavljuje se u poslovni raspored koristeći šifru koju mu je poslodavac dodijelio kako bi mogao pogledati raspored.
<<<<<<< HEAD
- **Privatni korisnik**: Stvara osobni raspored npr. za druženje s prijateljima ili obiteljske obaveze. Sudionici unose svoje slobodno vrijeme i zajedno određuju najpogodniji termin.
- *Primjer*: Studentica Ana koristi aplikaciju kako bi organizirala ispite i slobodne aktivnosti kroz mjesec.
=======
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- *Primjer*: Poslodavac Ante koristi aplikaciju kako bi napravio raspored za radni tjedan u svojoj trgovini.
---

## 3. Technical Architecture
### 3.1 Tech Stack & Rationale
- **HTML** – osnova korisničkog sučelja.
- **CSS** – vizualni dizajn, stil i prilagodba izgleda.
<<<<<<< HEAD
- **React** – omogućuje dinamično upravljanje komponentama, stanje aplikacije i modularnost potrebnu za složenu logiku rasporeda.

### 3.2 High-Level Architecture
- **Frontend:** React aplikacija koja prikazuje forme, rezultate i generirani raspored.
=======
- **JavaScript** - omogućuje funkcionalnost i interakciju unutar aplikacije.

### 3.2 High-Level Architecture
- **Frontend:** Aplikacija koja prikazuje forme, rezultate i generirani raspored.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- **AI modul:** Unutar frontend logike ili integriran preko posebnog procesnog modula. Analizira uvjete i kreira optimalni raspored.


### 3.3 Project Directory Structure
```
<<<<<<< HEAD
project_root/
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── specifications.md
└── README.md
=======
SmartSchedule-dmaric-dcaleta-agrubisic/
├── projekt_webstranica/
│   ├── server
│   ├── Auth.js
│   ├── business-create.html
│   ├── business-final.html
│   ├── dashboard.html
│   ├── global.css
│   ├── index.html
│   ├── nav.js
│   ├── personal.js
│   └── schedules.js
├── specifications.md
├── README.md
└── Mermaid diagram.png
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
```

---

## 4. Data Design (The Domain Model)
### Core Entities:
- **Person (Osoba)** – radnik, sudionik ili bilo koja osoba povezana s rasporedom.
<<<<<<< HEAD
- **Event (Događaj/Obveza)** – radna smjena, druženje ili bilo koji vremenski definirani događaj.
=======
- **Event (Događaj/Obveza)** – radna smjena ili bilo koji vremenski definirani događaj.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- **Schedule (Raspored)** – skup događaja generiran AI analizom.

### Schemas (JSON)
**Person**
```
{
  "id": "string",
  "name": "string",
  "availability": ["2025-06-01T08:00", "2025-06-01T16:00"]
}
```

**Event**
```
{
  "id": "string",
  "title": "string",
  "description": "string",
  "startTime": "2025-06-01T10:00",
  "endTime": "2025-06-01T12:00",
  "participants": ["personId1", "personId2"],
  "type": "business" | "social"
}
```

**Schedule**
```
{
  "id": "string",
  "createdAt": "2025-06-01T09:00",
  "events": ["eventId1", "eventId2"],
  "isFinal": false
}
```

### Storage Strategy
<<<<<<< HEAD
- Podaci se čuvaju u React state-u.
=======
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- Finalizirani raspored može se izvesti kao JSON datoteka.
- Nema trajnog spremanja u bazu podataka (trenutno izvan scope-a).

---

## 5. Interface Specifications
<<<<<<< HEAD
- Početna stranica omogućava odabir vrste rasporeda: **Poslovni** ili **Osobni**.
=======
- Početna stranica omogućava izradu poslovnog rasporeda.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- Poslovni mod:
  - Unos tvrtke pri registraciji poslodavca.
  - Dinamički unos radnika klikom na "+".
  - Definiranje radnih uvjeta i smjena.
  - Generiranje šifre za radnike.
<<<<<<< HEAD
- Osobni mod:
  - Sudionici se mogu pridružiti dodavanjem imena.
  - Svaka osoba unosi svoje slobodno vrijeme.
  - Sustav traži najbolji mogući termin.
=======
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- Prikaz AI povratnih informacija ispod rasporeda.

---

## 6. Functional Specifications (Module Breakdown)
### Module A – Config Loader
<<<<<<< HEAD
- Forma za unos podataka o rasporedu.
=======
- Forma za prijavu/registraciju.
- Odabir prijave kao poslodavac
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- Validacija obaveznih polja.
- Prikaz grešaka (npr. prazna polja, neispravni formati).

### Module B – The Processor
<<<<<<< HEAD
- Dodavanje novih događaja i osoba.
- Ažuriranje liste radnika ili sudionika.
=======
- Unos informacija o zaposlenicima
- Ažuriranje liste zaposlenika ili sudionika.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- AI proces generiranja optimalnog rasporeda.
- Mogućnost uređivanja prije finalnog spremanja.

### Module C – The Reporter
- Prikaz generiranog rasporeda.
<<<<<<< HEAD
- Prikaz liste događaja, radnika i dostupnosti.
=======
- Prikaz liste događaja, zaposlenika i dostupnosti.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- Prikaz AI povratnih informacija.

---

## 7. Development Plan & Milestones
### Milestone 1 – Skeleton
<<<<<<< HEAD
- Postavljanje početne React strukture.
=======
- Postavljanje početne strukture.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
- Prikaz naslova aplikacije.

### Milestone 2 – Core Logic
- Implementacija formi za unos podataka.
- Logika dodavanja osoba i obaveza.

### Milestone 3 – Interface
- Vizualno oblikovanje (CSS).
- Stiliziranje komponenti.

### Milestone 4 – Polish
- Dokumentacija.
- Ispravak manjih bugova.

### Definition of Done
- Aplikacija prihvaća sve korisničke podatke.
- AI vraća odgovarajući raspored.
- Korisnik može urediti raspored prije spremanja.
- Finalni raspored se ispravno izvozi.

---

## 8. Testing & Quality Strategy
- **Unit Tests:**
  - Dodavanje nove obveze prikazuje se ispravno.
  - Prazni podaci aktiviraju validacijsku grešku.
<<<<<<< HEAD

---

## 9. Future Improvements (Roadmap)
- Dodavanje tamnog moda.
- Integracija sa Gmailom.
- Spremanje rasporeda u oblaku.
- Mogućnost dijeljenja rasporeda putem linka.

=======
---

## 9. Future Improvements (Roadmap)
- Integracija sa Gmailom.
- Spremanje rasporeda u oblaku.
- Mogućnost dijeljenja rasporeda putem linka.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
