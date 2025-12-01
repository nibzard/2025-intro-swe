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
API integracije - RESTful API (za izvođače), Entrio API (za koncerte)
Kontrola verzija - Git & GitHub
Razvojno okruženje - Visual Studio Code


### React.js (Frontend)

- Za izradu korisničkog sučelja: prikaz korisnika, njihovih glazbenih preferencija, liste koncerata i chat.
- Komponente (npr. UserCard, EventList, ChatBox) će se koristiti za modularno i responzivno UI rješenje.

### Node.js + Express (Backend)

- Za logiku aplikacije koja se odvija na serveru: registracija/prijava korisnika, spremanje i dohvat podataka o preferencijama, korisnicima i događajima.
- Express će služiti za kreiranje RESTful API-ja kojim frontend komunicira s bazom podataka i vanjskim servisima.

### RESTful API (za izvođače)

- Omogućuje dohvat informacija o izvođačima, npr. popularnih pjesama, albuma ili sličnih izvođača.
- Backend će pozivati API i slati podatke frontend komponentama.

### Entrio API (za koncerte)

- Za prikaz događaja i koncerata u blizini korisnika.
- Backend dohvaća podatke preko API-ja i šalje ih frontend-u za prikaz.

### Git & GitHub (kontrola verzija)

- Za praćenje promjena u kodu, rad na različitim značajkama preko feature branch-eva i suradnju s timom.
- PR-ovi (Pull Requests) omogućuju pregled i odobrenje promjena prije spajanja u main branch.

### Visual Studio Code (razvojno okruženje)

- Glavni alat za pisanje koda, debugging i testiranje.
- Može se koristiti s dodatcima za React, Node.js, Git i API testiranje (npr. Postman).

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
