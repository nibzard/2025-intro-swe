Aplikacija HERCircle sastoji se od tri glavne komponente:

Frontend – moderno i intuitivno korisničko sučelje gdje žene mogu pregledavati objave, pratiti druge korisnice, komentirati i dijeliti sadržaj.

Backend API – zadužen za obradu zahtjeva, autentikaciju, spremanje i dohvat podataka te komunikaciju s bazom podataka.

Baza podataka – sigurno pohranjuje sve korisničke informacije, objave, komentare, favorite, podatke o ciklusu i postavke privatnosti.

Funkcionalnosti

-Registracija i prijava korisnica
-Kreiranje i uređivanje osobnog profila (slika, opis, interesi)
-Objavljivanje postova, fotografija i inspirativnih citata
-Komentiranje i reagiranje na objave drugih korisnica
-Dodavanje objava u favorite
-Praćenje drugih korisnica i pregled njihovih aktivnosti
-Personalizirani feed temeljen na interesima i praćenim profilima
-Praćenje menstrualnog ciklusa s podsjetnicima i analizom unosa
-Sigurna pohrana podataka uz zaštitu privatnosti
-Pregled statistika aktivnosti (npr. broj objava, favorita, pratitelja)

API rute (primjer)
Metoda Ruta Opis
POST /register Registracija nove korisnice
POST /login Prijava korisnice
GET /posts Dohvat svih objava
POST /posts Kreiranje nove objave
POST /posts/:id/comment Dodavanje komentara na objavu
POST /posts/:id/favorite Dodavanje objave u favorite
GET /profile/:username Dohvat javnog profila korisnice
GET /feed Dohvat personaliziranog feeda
GET /cycle Pregled i praćenje ciklusa
PUT /cycle/update Ažuriranje podataka o ciklusu

Model i logika aplikacije

-Autentikacija: JWT tokeni za siguran pristup korisničkim računima i zaštitu osobnih podataka
-Feed algoritam: prikazuje sadržaj korisnica koje korisnica prati, uz preporuke temeljem sličnih interesa
-Praćenje ciklusa: algoritam predviđa sljedeću menstruaciju i plodne dane na osnovi unesenih podataka
-Sigurnosni sustav: hashiranje lozinki, zaštita API ruta i ograničavanje pristupa osjetljivim informacijama
-Notifikacijski sustav: obavijesti o komentarima, novim objavama i ciklus podsjetnicima

Tehnologije i alati

-Frontend: React / Vite / HTML / CSS / Tailwind
-Backend: Node.js / Express
-Baza podataka: MongoDB / Mongoose ORM
-Autentikacija: JWT (JSON Web Tokens)
-Verzioniranje: GitHub
-Testiranje: Jest / Postman

🚀 Budući planovi razvoja

-Uvođenje chat sustava za privatne poruke i grupne razgovore pomoću chatgt-ja
-Push notifikacije za nove objave, komentare i ciklus podsjetnike
-Napredno pretraživanje profila i objava prema interesima, lokaciji i oznakama (hashtagovima)
-AI preporuke sadržaja na temelju aktivnosti i preferencija korisnice
-Dark/Light tema i dodatne mogućnosti prilagodbe profila
-Mobilna aplikacija (iOS i Android) s istim funkcionalnostima i offline načinom rada
-Forum sekcija s tematskim raspravama (zdravlje, karijera, odnosi, majčinstvo, fitness itd.)
