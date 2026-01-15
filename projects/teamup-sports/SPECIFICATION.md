# TeamUp Sports

## 1. Opis projekta
Aplikacija koja omogućava prijavu na sportske turnire.  
Korisnici se mogu prijaviti kao ekipa ili individualno, a sustav spaja pojedince u timove prema sportu i lokaciji.

---

## 2. Ciljevi projekta
- Povezati ljude koji žele igrati sport, ali nemaju ekipu.  
- Omogućiti brzu prijavu na turnire.  
- Automatizirati proces spajanja u timove.  

---

## 3. Funkcionalni zahtjevi
- Registracija i prijava korisnika  
- Pregled dostupnih turnira  
- Prijava s ekipom  
- Individualna prijava (matchmaking)  
- Upravljanje turnirima (admin panel)  

---

## 4. Nefunkcionalni zahtjevi
- Sigurna pohrana lozinki (hashiranje)  
- Web aplikacija mora raditi na mobitelu i računalu  
- Brz odziv (< 1 sekunde na upite)  
- Intuitivno korisničko sučelje  

---

## 5. Dijagram sustava

```mermaid
flowchart LR
  U[User] -->|Registracija/Prijava| A[Auth Service]
  U -->|Pregled turnira| T[Turniri]
  U -->|Prijava individualna| M[Matchmaking modul]
  M --> DB[(Baza podataka)]
  T --> DB
  A --> DB
classDiagram
  class User {
    +id: int
    +name: string
    +email: string
    +passwordHash: string
  }

  class Team {
    +id: int
    +name: string
    +sport: string
  }

  class Tournament {
    +id: int
    +title: string
    +location: string
    +date: date
  }

  class Registration {
    +id: int
    +userId: int
    +teamId: int
    +tournamentId: int
  }

  User "1" -- "many" Registration
  Team "1" -- "many" Registration
  Tournament "1" -- "many" Registration
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant B as Backend
  participant DB as Database

  U->>F: Klikne “Prijavi se”
  F->>B: POST /re
  gister
  B->>DB: Spremi podatke
  DB-->>B: OK
  B-->>F: 201 Created
  F-->>U: Potvrda prijave
