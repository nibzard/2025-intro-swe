# POVIJEST VERZIJA - Skripta (Studentski Forum)

Ovaj dokument prati kronološke promjene kroz projekt **Skripta** (Studentski Forum) koristeći semantičko verzioniranje (MAJOR.MINOR.PATCH).

**Naziv projekta:** Skripta (ranije Studentski Forum)
**Tim:** trikostura-jpavic-mlistes-djsartori
**Tehnološki stack:** Next.js, TypeScript, Supabase, Tailwind CSS

---

## V0.1.0 - Specifikacija Projekta (5. studenog 2025.)

**Datum objave:** 5. studeni 2025.

### Dodano
- Početna specifikacija projekta i dokumentacija zahtjeva
- Prijedlog projekta koji zadovoljava tražene kriterije

---

## V1.0.0 - Implementacija Osnovnog Foruma (3.-4. prosinca 2025.)

**Datum objave:** 4. prosinac 2025.

### Dodano
- Kompletna implementacija Studentskog Foruma s modernim tehnološkim stackom
  - Next.js frontend framework
  - Supabase backend i autentifikacija
  - TypeScript za type safety
  - Tailwind CSS za stilizaciju
- Osnovne funkcionalnosti foruma:
  - Kreiranje i pregled tema
  - Sustav odgovora
  - Autentifikacija i profili korisnika
  - Organizacija po kategorijama
- Markdown podrška za kreiranje postova
- Admin panel za moderaciju
- Mogućnost uređivanja profila
- Sustav notifikacija
- Administrativni alati za moderaciju sadržaja
- Mogućnosti masovnog ažuriranja

### Promijenjeno
- Ažuriran README s detaljnim informacijama o projektu

---

## V1.1.0 - Prilozi Datoteka i UI Poboljšanja (4.-5. prosinca 2025.)

**Datum objave:** 5. prosinac 2025.

### Dodano
- Funkcionalnost priloga datoteka za teme i odgovore
- Napredni sustav učitavanja datoteka s poboljšanom podrškom za medije
- Sveobuhvatna poboljšanja odgovora i tema
- Mogućnosti prilagodbe profila

### Ispravljeno
- TypeScript greške i anotacije tipova kroz cijelu bazu koda
- Problemi s inicijalizacijom Supabase klijenta na više stranica
- Postavljanje pravila pohrane za priloge
- Greške s prerenderiranjem na stranicama foruma

---

## V1.2.0 - Mobilna Optimizacija i Brendiranje (5.-6. prosinca 2025.)

**Datum objave:** 6. prosinac 2025.

### Dodano
- Sveobuhvatan responzivni dizajn za mobilne uređaje
- Profilne slike kroz cijelu stranicu
- Skripta brendiranje (preimenovano iz Studentski Forum)
- Prilagođeni logo inspiriran hrvatskom kulturom
- Favicon i metadata stranice
- Dark mode toggle s next-themes integracijom
- Dropdown birač tema
- Sigurnosni middleware i sanitizacija unosa

### Promijenjeno
- Redizajnirana početna stranica s modernim Skripta brendiranjem
- Prevedeno admin sučelje na hrvatski
- Optimizirane admin i profile stranice za mobilne uređaje
- Pojednostavljen CTA na početnoj stranici
- Ažurirana godina autorskih prava na 2025.
- Automatsko učitavanje avatara i bannera pri odabiru datoteke

### Ispravljeno
- Problemi s rasporedom mobilne stranice na stranici profila
- Problemi s prikazivanjem avatara na stranici profila
- ThemeProvider importi tipova
- Funkcionalnost učitavanja avatara
- Funkcionalnost uklanjanja profilne slike

---

## V1.3.0 - Napredne Funkcionalnosti (6.-7. prosinca 2025.)

**Datum objave:** 7. prosinac 2025.

### Dodano
- Napredna funkcionalnost pretraživanja
- Poboljšanja učitavanja profilnih slika
- Sveobuhvatan sustav reputacije
- Mogućnost uređivanja tema i odgovora
- Napredne funkcionalnosti foruma uključujući:
  - Trendovske teme
  - Filtri sadržaja
  - Paginacija
  - Sustav upozorenja i timeout-a korisnika
- Sustav privatnih poruka
- Sustav praćenja/pratitelja korisnika
- Funkcionalnost bookmarkinga
- Sustav prijavljivanja tema/odgovora
- Sustav zabrane korisnika za admin moderaciju
- Označavanje rješenja za teme
- Sustav spominjanja (@korisničko_ime)

### Promijenjeno
- Poboljšan sustav notifikacija s real-time ažuriranjima
- Poboljšana mobilna optimizacija
- Uklonjeni redundantni UI gumbi
- Poboljšan UX za uređivanje profila i učitavanje slika

### Ispravljeno
- Problemi s vidljivošću teksta u dark mode-u
- Prikaz avatara u mobilnom izborniku
- Prelijevanje teksta na stranicama profila
- Dvosmislene reference stupaca u sustavu reputacije
- Problemi s preusmjeravanjem nakon uređivanja profila
- Reference stranog ključa u upitima za prijave
- Rukovanje greškama na stranici bookmarks
- Prikaz tema foruma s ručnim joinovima
- Čišćenje osiroćenih profila pri registraciji

---

## V2.0.0 - Resetiranje Lozinke i Email Sustav (7. prosinca 2025.)

**Datum objave:** 7. prosinac 2025.

### Dodano
- Potpuni prilagođeni sustav resetiranja lozinke
- Sigurno resetiranje lozinke putem e-maila
- Sustav verifikacije e-maila
- Auth callback handleri za oporavak lozinke
- PKCE podrška za autentifikacijski tok
- Email predlošci koji odgovaraju brendiranju web stranice
- Base64 ugrađeni logo za kompatibilnost e-maila
- Poboljšanja pristupačnosti:
  - Pristupačnost zvona za notifikacije
  - Potpuna revizija pristupačnosti aplikacije

### Promijenjeno
- Prebačeno s Resenda na Nodemailer s Gmail SMTP-om
- Preimenovan pošiljatelj e-maila iz "Studentski Forum" u "Skripta"
- Poboljšan dizajn email predloška
- Poboljšano rukovanje greškama i logiranje pri resetiranju lozinke

### Ispravljeno
- Tok resetiranja lozinke s PKCE kompatibilnošću
- RLS pravilo za server-side token operacije
- Rukovanje tokenima u auth callbacku
- Inicijalizacija email transportera za serverless okruženje
- Problemi s trailing slashom u redirect URL-ovima
- Hrvatska gramatika u email predlošcima
- Učitavanje i renderiranje email loga

---

## V2.1.0 - Performanse i Analitika (7.-8. prosinca 2025.)

**Datum objave:** 8. prosinac 2025.

### Dodano
- Vercel Analytics i Speed Insights integracija
- Jedinstveno praćenje pregleda po korisniku/sesiji
- Breadcrumb navigacija kroz sve stranice foruma
- Vizualni feedback i tooltipovi za navigaciju
- Sveobuhvatne animacije gumba
- Notifikacije bookmarks u navbaru s animacijama
- Dijalozi za potvrdu kritičnih radnji (prikvači, zaključaj teme)
- Profilne slike u korisničkoj ljestvici admin panela
- Stranica naprednog pretraživanja s poboljšanim UX-om

### Promijenjeno
- Masivna poboljšanja UI-a i potpuna revizija auth sustava
- Optimizirane performanse web stranice:
  - Optimizacija upita baze podataka (3-5x brže)
  - Paralelno procesiranje upita
  - Poboljšanja na razini komponenti
- Poboljšane forme tema i odgovora s dodatnim funkcionalnostima
- Poboljšan vizualni dizajn stranica tema
- Moderna poboljšanja dizajna kroz cijelu web stranicu

### Ispravljeno
- 404 greške diljem stranice
- Not-found stranica (konvertirana u klijentsku komponentu)
- TypeScript greške u praćenju pregleda
- Greške postavljanja kolačića u Server komponentama
- Redizajn stranice profila s modernim UI-em
- TypeScript greške u filterima stranice foruma
- Sporo učitavanje stranica s paralelnim upitima
- Greške generiranja metapodataka tema

---

## V2.2.0 - Sustav Gamifikacije (11. prosinca 2025.)

**Datum objave:** 11. prosinac 2025.

### Dodano
- Potpuni sustav gamifikacije:
  - Sustav postignuća s višestrukim postignućima
  - Korisničke ljestvice (svih vremena i tjedne)
  - Praćenje aktivnosti i statistika
  - Automatska provjera postignuća pri posjetu profilu
  - Dashboard statistika s sveobuhvatnim metrikama
- Linkovi navigacije ljestvice u navbaru i mobilnom izborniku
- Postignuće ranog korisnika (datum lansiranja prosinac 2025.)
- IDE podrška s TypeScript definicijama tipova

### Promijenjeno
- Odvojena klijent/server logika postignuća za bolje performanse
- Ažurirani importi i definicije postignuća
- Poboljšana RLS pravila za server-side umetanje postignuća

### Ispravljeno
- TypeScript greške u sustavu postignuća
- Konflikti naziva varijabli na stranici profila
- Problemi zaključivanja tipova u ljestvici
- Duplikati statistika u Stats Dashboardu
- Logika provjere postignuća i rukovanje greškama
- Optimizacije upita baze podataka za brže učitavanje stranica (60-85% poboljšanje)

---

## V2.3.0 - Moderacija Sadržaja i Dorada (12. prosinca 2025.)

**Datum objave:** 12. prosinac 2025.

### Dodano
- Sveobuhvatan sustav moderacije sadržaja (hrvatski jezik):
  - Detekcija spam-a
  - Ograničavanje stope
  - Filtriranje sadržaja
- Sustav kreiranja i glasovanja za ankete
- Sustav reakcija na postove
- Admin sustav notifikacija za upozorenja, zabrane i timeout-e
- Error boundaries za bolje rukovanje greškama
- Filtriranje kartica na strani klijenta
- Optimizacije za produkcijsko okruženje na Vercelu

### Promijenjeno
- Prevedena moderacija sadržaja na hrvatski
- Optimizirane auth akcije i smanjene nepotrebne upite
- Poboljšana TypeScript type safety kroz aplikaciju
- Poboljšano privatno chat sučelje
- Poboljšane notifikacije za praćenje/poruke
- Spremanje profila s trenutnim scroll-om na vrh
- Loading overlay za sprječavanje UI treptanja

### Ispravljeno
- Linter i TypeScript poboljšanja za ankete i reakcije
- Server-side importi u alatima za moderaciju sadržaja
- TypeScript greške tipova u forum akcijama
- RLS-blokirane operacije sa server akcijama
- AdminClient reference u moderacijskim funkcijama
- Ažuriranja UI-a pri brisanju teme
- Akcija email verifikacije
- Upiti profila notifikacija
- Stranica bookmarks - sakrivanje izbrisanih tema
- Navigacija uređivanja profila s router.back()
- Problemi prikaza tema foruma
- Poruke validacijskih grešaka za prikaz specifičnih polja

---

## V2.4.0 - AI Asistent (12. prosinca 2025.)

**Datum objave:** 12. prosinac 2025.

### Dodano
- AI Asistent za Učenje pokrenut Google Gemini API-jem (besplatna razina)
  - Automatsko naslovljavanje razgovora
  - Upravljanje razgovorima
  - Funkcionalnost brisanja razgovora
  - Plutajući gumb asistenta
  - Gumb za izlaz iz asistenta
- Indikatori tipkanja s profilnim slikama u porukama
- Poboljšanja pouzdanosti real-time indikatora tipkanja

### Promijenjeno
- Prebačeno s Claude 3.5 Sonneta na Google Gemini radi ekonomičnosti
- Poboljšana implementacija indikatora tipkanja
- Poboljšana robusnost migracija

### Ispravljeno
- Kompatibilnost verzije i modela Gemini API-ja
- Izgled i klikabilnost plutajućeg gumba asistenta
- Overlay brisanja razgovora
- Čišćenje console logiranja

### Uklonjeno
- AI Asistent funkcionalnost (potpuno uklonjena nakon testiranja)

---

## V2.5.0 - Dorada Registracije i Autentifikacije (12.-13. prosinca 2025.)

**Datum objave:** 13. prosinac 2025.

### Dodano
- Real-time provjera dostupnosti e-maila tijekom registracije
- Brojač znakova korisničkog imena
- Dosljedni placeholderi kroz forme
- Stranice uvjeta korištenja i politike privatnosti
- Testimonial slider komponenta za početnu stranicu
- Prisilna email verifikacija prije prijave
- Poboljšan tekst pomoći pri registraciji

### Promijenjeno
- Poboljšana dosljednost prijave i rukovanje sesijama
- Zadržavanje podataka forme registracije kroz navigaciju
- Pojednostavljen tok i UI registracije
- Poboljšano ponašanje gumba za povratak na stranicama uvjeta/privatnosti
- Onemogućen gumb za slanje pri konfliktu e-maila
- Uže razmaci i poboljšan raspored
- Ispravljena navigacija na stranicama uvjeta/privatnosti
- Praćene promjene početne stranice i liste tema
- Postavljen baseUrl za razrješavanje path aliasa

### Ispravljeno
- Zadržavanje polja korisničkog imena u formi registracije
- Tipizacija provjere email verifikacije u toku prijave
- Rukovanje Turnstile site ključem
- Navigacija browser back na stranicama uvjeta/privatnosti

### Uklonjeno
- Turnstile captcha sustav (uklonjeno UI, server verifikacija i validacija)

---

## V2.5.1 - Ažuriranje Paketa Ovisnosti (13. prosinca 2025.)

**Datum objave:** 13. prosinac 2025.

### Promijenjeno
- Ažuriran package-lock.json s potrebnim ovisnostima za prvu instalaciju

### Ispravljeno
- Problemi s ovisnostima pri prvoj npm instalaciji
- Konflikti u package-lock.json

---

## Statistika Sažetka

- **Ukupno Commitova:** 241
- **Razdoblje Razvoja:** 5. studeni 2025. - 13. prosinac 2025. (38 dana)
- **Glavne Verzije:** 3 (V0, V1, V2)
- **Manje Verzije:** 10
- **Patch Verzije:** 1
- **Primarni Tech Stack:** Next.js, TypeScript, Supabase, Tailwind CSS
- **Ključne Značajke:** Forum sustav, gamifikacija, AI asistent (uklonjen), moderacija sadržaja, mobile-first dizajn

---

## Ključne Prekretnice

| Datum | Verzija | Prekretnica |
|------|---------|-----------|
| 5. stu 2025. | V0.1.0 | Specifikacija projekta |
| 3. pro 2025. | V1.0.0 | Implementacija osnovnog foruma |
| 6. pro 2025. | V1.2.0 | Rebrendiranje u "Skripta" |
| 7. pro 2025. | V2.0.0 | Potpuni sustav autentifikacije |
| 11. pro 2025. | V2.2.0 | Lansiran sustav gamifikacije |
| 12. pro 2025. | V2.4.0 | AI asistent (kasnije uklonjen) |
| 13. pro 2025. | V2.5.1 | Trenutna verzija |

---

## Smjernice Verzioniranja

Ovaj projekt slijedi [Semantičko Verzioniranje](https://semver.org/):

- **GLAVNA verzija** (X.0.0): Nekompatibilne API promjene ili fundamentalne arhitekturne promjene
- **MANJA verzija** (0.X.0): Nove funkcionalnosti dodane na način kompatibilan s prijašnjim verzijama
- **PATCH verzija** (0.0.X): Popravci grešaka i manja poboljšanja kompatibilna s prijašnjim verzijama

---

*Zadnje Ažurirano: 13. prosinac 2025.*
