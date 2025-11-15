# SPECIFICATION.md

## Naziv projekta
TuneBuddy — Connect through music

---

## Članovi tima
- Karmen Grubić
- Matea Begonja
- Barbara Jezidžić

---

## Opis projekta
TuneBuddy je web aplikacija koja povezuje ljude sa sličnim glazbenim ukusom i predlaže zajedničke događaje poput koncerata i festivala u blizini.

Korisnik unosi svoje omiljene izvođače i glazbene žanrove, a aplikacija pomoću algoritma uspoređuje te preferencije s drugima.  
Na temelju rezultata, TuneBuddy prikazuje listu korisnika sa sličnim ukusom, omogućuje im povezivanje i nudi prijedloge glazbenih događanja na kojima bi se mogli upoznati.

Cilj projekta je stvoriti digitalno okruženje gdje glazba postaje način upoznavanja i stvaranja novih prijateljstava.

---

## Ključne funkcionalnosti
- Registracija i prijava korisnika (e-mail ili GitHub login)
- Unos omiljenih izvođača i žanrova
- Preporuke korisnika sa sličnim glazbenim ukusom
- Prikaz korisnika u blizini (geolokacija)
- Prikaz i preporuka koncerata / festivala
- Chat s “matchanim” korisnicima
- Moderni, responzivni UI u Reactu
- Integracija s GitHubom za autentikaciju i verzioniranje

---

## Tehnologije
Sloj - Tehnologije
Frontend - React.js
Backend - Node.js (Express)
API integracije - Spotify API (za izvođače), Ticketmaster API (za koncerte)
Kontrola verzija - Git & GitHub
Razvojno okruženje - Visual Studio Code

---

## Dijagrami (Mermaid)

### Dijagram toka prijave i preporuke
flowchart TD
A[Pocetak] --> B[Prijava korisnika]
B --> C{Novi korisnik?}
C -->|Da| D[Unos izvođača i žanrova]
C -->|Ne| E[Preuzimanje preferencija iz baze]
D --> F[Spremanje podataka]
E --> F
F --> G[Usporedba s drugim korisnicima]
G --> H[Prikaz preporučenih korisnika i koncerata]
H --> I[Korisnik bira hoće li kontaktirati]
I --> J[Kraj]```


## Dijagram klasa
classDiagram
User --> Preference
User --> Match
User --> Event

class User {
  +String id
  +String name
  +String email
  +List<Preference> preferences
  +login()
  +matchUsers()
}

class Preference {
  +String artist
  +String genre
}

class Match {
  +String userId1
  +String userId2
  +Double similarityScore
}

class Event {
  +String name
  +String location
  +String date
  +List<String> artists
}


## Dijagram React komponenti
graph TD
A[App.js] --> B[Navbar]
A --> C[LoginPage]
A --> D[Dashboard]
D --> E[MatchList]
D --> F[ConcertList]
E --> G[ChatComponent]
