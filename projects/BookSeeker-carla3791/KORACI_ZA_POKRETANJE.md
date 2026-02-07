# BookSeeker – korak po korak (sve što trebaš napraviti)

## Što je već popravljeno u kodu (ne moraš ništa mijenjati)

- **Backend** sada šalje rezultate u obliku koji aplikacija očekuje, pa će se knjige prikazivati.
- Ako imaš Google Books API ključ u `.env`, pretraga će vraćati prave knjige s interneta.
- Ako nemaš ključ, prikazat će se dva primjer rezultata (Harry Potter i Lord of the Rings) kad nešto pretražiš.

Ti samo trebaš **pokrenuti** aplikaciju. Evo kako, korak po korak.

---

## Što ti treba na računalu

- **Node.js** – program koji omogućuje pokretanje ove aplikacije.  
  Ako ga nemaš: skini ga s https://nodejs.org (preporučena LTS verzija) i instaliraj (Next, Next, dok ne dođeš do kraja).

---

## Korak 1: Otvori mapu projekta

1. Otvori **Cursor** (ili bilo koji editor).
2. Otvori mapu **BookSeeker** (ona u kojoj vidiš mape `client` i `server`).  
   To je tvoj “korijen” projekta.

---

## Korak 2: Pokreni server („straga“ aplikacije)

Server je dio koji pretražuje knjige i sprema ih. Mora raditi dok koristiš aplikaciju.

1. U Cursoru otvori **terminal** (npr. **Terminal → New Terminal** ili kratica).
2. U terminalu napiši točno ovo i pritisni **Enter**:
   ```bash
   cd server
   ```
   (To znači: “uđi u mapu server”.)
3. Zatim napiši i pritisni **Enter**:
   ```bash
   npm install
   ```
   (To preuzima sve što server treba. Može potrajati nekoliko sekundi.)
4. Zatim napiši i pritisni **Enter**:
   ```bash
   npm run dev
   ```
5. Kad vidiš nešto poput: **“BookSeeker backend sluša na http://localhost:4000”** – **server radi**.  
   **Ovaj prozor ne zatvaraj**; ostavi ga otvoren.

---

## Korak 3: Pokreni stranicu („prednji“ dio aplikacije)

Stranica je ono što vidiš u pregledniku – gdje upisuješ pretragu i vidiš knjige.

1. Otvori **novi terminal** (opet **Terminal → New Terminal** ili drugi +).
2. U **novom** terminalu napiši i pritisni **Enter**:
   ```bash
   cd client
   ```
3. Zatim:
   ```bash
   npm install
   ```
4. Zatim:
   ```bash
   npm run dev
   ```
5. Kad vidiš nešto poput: **“Local: http://localhost:5173/”** – **stranica radi**.
6. U pregledniku (Chrome, Edge, Firefox…) otvori adresu: **http://localhost:5173**  
   (možeš je i kliknuti ako je u terminalu plava/podcrtana).

Sada bi trebala vidjeti BookSeeker: naslov, tab “AI pretraga” i “Moja biblioteka”.

---

## Korak 4: Isprobaj AI pretragu

1. Ostani na tabu **“AI pretraga”**.
2. U veliki okvir napiši bilo što, npr.: **“Harry Potter”** ili **“roman o vremenu”**.
3. Klikni **“Pretraži knjige”**.
4. Trebale bi se pojaviti knjige ispod (barem dva primjer rezultata ako nemaš Google ključ, ili više pravih rezultata ako imaš ključ).

Ako se ništa ne pojavi, vrati se na Korak 2 i 3 i provjeri jesu li **oba** terminala još uvijek pokrenuta (server na 4000, client na 5173).

---

## Opcionalno: Prava pretraga s Google Books (više knjiga s interneta)

Ako želiš da pretraga vraća **prave** knjige s interneta (ne samo dva primjera):

1. Trebaš **Google Books API ključ** (besplatan, na Google Cloud konzoli).
2. U mapi **server** napravi datoteku s imenom **`.env`** (točno tako, s točkom na početku).
3. U nju stavi (zamijeni `TVOJ_KLJUC` stvarnim ključem):
   ```
   GOOGLE_BOOKS_API_KEY=TVOJ_KLJUC
   PORT=4000
   ```
4. **Spremi** datoteku i **ponovno pokreni server** (u terminalu gdje je server: pritisni Ctrl+C, pa opet `npm run dev`).

Ako ovo preskočiš, aplikacija i dalje radi – samo će pri pretrazi prikazivati ona dva primjer rezultata.

---

## Sažetak

| Što si pitala | Odgovor |
|---------------|--------|
| Je li sve popravljeno u kodu? | **Da.** Ne moraš ništa sama mijenjati u kodu. |
| Što ti treba napraviti? | Samo **pokrenuti** server (Korak 2) i client (Korak 3), pa otvoriti **http://localhost:5173** u pregledniku. |
| Zašto “korak po korak”? | Da možeš točno kopirati naredbe i redom klikati – bez pretpostavke da znaš sve. |

Ako negdje zapneš, napiši **točno** što si napravila (npr. “ušla sam u cd server, onda npm install”) i koju poruku ili grešku vidiš – onda mogu sljedeći korak napisati još preciznije.
