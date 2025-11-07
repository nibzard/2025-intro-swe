# TeamConnect - SPECIFICATION

**Course:** Uvod u programsko inženjerstvo  
**Project:** TeamConnect  
**Team:** Đana Rogulj & Karolina Mihaljević  
**Status:** U izradi

---

## 1️⃣ User Requirements (Korisnički zahtjevi)

- Korisnici se mogu registrirati i prijaviti
- Korisnici mogu odabrati sport i lokaciju (Split, kvart)
- Aplikacija automatski spaja korisnike u timove ako im fali igrača
- Prikaz dostupnih timova po sportu i lokaciji
- Korisnici mogu upravljati svojim profilom

---

## 2️⃣ System Requirements (Zahtjevi sustava)

- Backend podržava registraciju, autentikaciju i pohranu korisnika
- Baza podataka pohranjuje informacije o korisnicima i timovima
- Sustav automatski kreira timove na temelju dostupnih korisnika i kvarta
- Frontend omogućuje pregled i filtriranje timova po sportu i lokaciji
- Logika spajanja u timove mora biti skalabilna i brza

---

## 3️⃣ Software Specification (Specifikacija programske potpore)

### 3.1 Data Model

```mermaid
classDiagram
class User {
    +String username
    +String email
    +String password
    +String sport
    +String location
}
class Team {
    +String sport
    +String location
    +List~User~ members
    +int maxPlayers
}
User --> Team : belongsTo

### 3.2 System Architecture (Arhitektura sustava)

```mermaid
graph TD
    A[Korisnik] -->|Registracija/Login| B[Autentikacija]
    B --> C[Odabir sporta i lokacije]
    C --> D[Pronalazak tima]
    D --> E[Prikaz dostupnih timova]
    E --> F[Spajanje u tim]
    F --> G[Upravljanje profilom]

sequenceDiagram
    participant U as User
    participant A as App
    U->>A: Registracija/Login
    A->>U: Potvrda autentikacije
    U->>A: Odabir sporta i lokacije
    A->>U: Prikaz dostupnih timova
    U->>A: Pridruživanje timu
    A->>U: Potvrda pridruživanja
