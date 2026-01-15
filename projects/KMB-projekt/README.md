# TuneBuddy — Connect through music

## Uvod

Glazba je jedan od najuniverzalnijih oblika povezivanja među ljudima. Iako postoje mnoge platforme za slušanje glazbe, ne postoji jednostavan način da korisnici pronađu osobe sličnog glazbenog ukusa ili događaje koji odgovaraju njihovim preferencijama. TuneBuddy nastaje kao rješenje koje želi iskoristiti glazbu kao most između ljudi.


## Predstavljanje problema

Korisnici često:
- imaju raznolike glazbene ukuse
- koriste različite glazbene platforme
- žele otkriti nove izvođače i događaje
- žele upoznati ljude sa sličnim interesima

Ne postoji jasan sustav koji:
- uspoređuje glazbene preferencije različitih korisnika
- spaja osobe sličnog ukusa
- preporučuje relevantne koncerte ili festivale u njihovoj blizini

TuneBuddy rješava ove probleme kombinacijom preferencija, algoritama podudaranja i lokacijskih preporuka.


## Hipoteza

Ako aplikacija omogući korisniku:
- unos omiljenih izvođača i glazbenih žanrova
- usporedbu tih preferencija s drugim korisnicima
- prikaz relevantnih glazbenih događaja u blizini

onda će korisnici lakše:
- pronaći osobe s kojima dijele glazbene interese
- stupiti u kontakt i započeti komunikaciju
- otkriti događaje koji odgovaraju njihovom ukusu
- razviti nova prijateljstva i društvene veze kroz glazbu


## Opis projekta

TuneBuddy je web aplikacija koja povezuje korisnike na temelju njihovog glazbenog ukusa te im preporučuje događaje poput koncerata i festivala u njihovoj blizini.

Korisnik se registrira (e-mail ili GitHub login), unosi svoje preferirane izvođače i žanrove, a aplikacija pomoću jednostavnog algoritma uspoređuje podatke s drugim korisnicima. Rezultat je lista korisnika sa sličnim glazbenim ukusom — tzv. „matchani korisnici“.

TuneBuddy također koristi geolokaciju kako bi korisniku prikazao događaje u okolici i omogućio stvaranje novih društvenih kontakata. Osim pregleda događaja i korisnika, aplikacija uključuje chat sustav koji omogućuje jednostavnu komunikaciju između matchanih korisnika.

Cilj projekta je stvoriti digitalnu platformu u kojoj glazba postaje sredstvo upoznavanja, povezivanja i otkrivanja novih iskustava.


## Ključne funkcionalnosti

- Registracija i prijava korisnika (e-mail ili GitHub)
- Unos omiljenih izvođača i glazbenih žanrova
- Algoritam za preporuku korisnika sa sličnim ukusom
- Prikaz korisnika u blizini (geolokacija)
- Preporuke koncerata i festivala (Ticketmaster API)
- Prikaz informacija o izvođačima (Spotify API)
- Chat s „matchanim“ korisnicima
- Moderan, responzivan UI u Reactu


