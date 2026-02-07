# BookSeeker – GitHub i objava na internetu

Ovaj vodič objašnjava **korak po korak** kako:
1. staviti projekt na **GitHub**,
2. objaviti aplikaciju **online** (da radi na internetu i na mobitelu).

Nije prekomplicirano – samo prati redom. Trebat će ti račun na GitHubu, a za besplatnu objavu koristit ćemo **Render** (backend) i **Vercel** (stranica).

---

## Dio 1: Staviti projekt na GitHub

### Korak 1.1: Otvori terminal u mapi projekta

- Otvori Cursor (ili VS Code) i otvori mapu **BookSeeker** (ona na Desktopu).
- Otvori terminal (**Terminal → New Terminal**).

U terminalu provjeri da si u pravoj mapi – trebao bi vidjeti `client` i `server`:

```bash
dir
```

(Linux/Mac: `ls`)

### Korak 1.2: Inicijaliziraj Git (ako već nije)

U terminalu upiši:

```bash
git init
```

Ako piše "Reinitialized" ili "already exists", to je u redu – nastavi.

### Korak 1.3: Dodaj sve datoteke i napravi prvi commit

```bash
git add .
git status
```

(`status` pokazuje što će biti u commit-u. Ne bi trebalo biti `server/.env` – ta datoteka je u .gitignore.)

Zatim:

```bash
git commit -m "BookSeeker - AI pretraga knjiga po opisu"
```

### Korak 1.4: Napravi repozitorij na GitHubu

1. Otvori preglednik i idi na **https://github.com**.
2. Ulogiraj se (ili napravi račun).
3. Klikni zeleni gumb **"New"** (ili **"+"** → **"New repository"**).
4. **Repository name:** npr. `BookSeeker` (ili kako želiš).
5. Ostavi **Public**.
6. **Ne** označavaj "Add a README" – projekt već ima datoteke.
7. Klikni **"Create repository"**.

### Korak 1.5: Poveži lokalni projekt s GitHubom i gurni kod

Na stranici novog repozitorija GitHub će pokazati naredbe. Koristi ove (zamijeni `TVOJ_GITHUB_USERNAME` svojim korisničkim imenom i `BookSeeker` imenom repozitorija ako si ga drugačije nazvala):

```bash
git remote add origin https://github.com/TVOJ_GITHUB_USERNAME/BookSeeker.git
git branch -M main
git push -u origin main
```

GitHub će možda zatražiti prijavu (username + lozinka ili token). Ako traži lozinku, moraš koristiti **Personal Access Token** umjesto obične lozinke (GitHub → Settings → Developer settings → Personal access tokens → Generate new token).

**Kad je push uspio** – projekt je na GitHubu.

---

## Dio 2: Objaviti backend online (Render)

Backend (server) mora raditi negdje na internetu da ga stranica i mobitel mogu zvati.

### Korak 2.1: Render račun

1. Idi na **https://render.com**.
2. Klikni **"Get Started for Free"** i registriraj se (npr. preko GitHub računa).

### Korak 2.2: Novi Web Service

1. Na Render dashboardu klikni **"New +"** → **"Web Service"**.
2. Poveži GitHub ako traži – odaberi svoj GitHub račun i **dopusti pristup repozitoriju** u kojem je BookSeeker.
3. Odaberi repozitorij **BookSeeker**.

### Korak 2.3: Postavke servisa

Popuni ovako:

| Polje | Vrijednost |
|------|------------|
| **Name** | npr. `bookseeker-api` (možeš i drugo ime) |
| **Region** | Bilo koji (npr. Frankfurt) |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

**Environment Variables** (klikni "Add Environment Variable"):

| Key | Value |
|-----|--------|
| `GOOGLE_BOOKS_API_KEY` | tvoj Google Books API ključ |
| `PORT` | `4000` (Render ga obično postavi sam, ali možeš i ručno) |

4. Klikni **"Create Web Service"**.

Render će pokrenuti build i deploy. Pričekaj da status bude **"Live"** (može potrajati par minuta).

### Korak 2.4: Kopiraj URL backend-a

Kad je servis Live, na vrhu stranice vidiš URL, npr.:

**https://bookseeker-api.onrender.com**

Taj URL ti treba za frontend – **skopiraj ga i spremi**.

---

## Dio 3: Objaviti frontend online (Vercel)

Stranica (React) ide na Vercel; od tamo će se otvarati na računalu i mobitelu.

### Korak 3.1: Vercel račun

1. Idi na **https://vercel.com**.
2. **"Sign Up"** ili **"Log in"** – preporučeno **"Continue with GitHub"**.

### Korak 3.2: Uvezi projekt

1. Klikni **"Add New..."** → **"Project"**.
2. Odaberi repozitorij **BookSeeker** (ako ga ne vidiš, poveži GitHub account).
3. **Project name:** može ostati BookSeeker.

### Korak 3.3: Postavke builda

Vercel će sam prepoznati Vite. Provjeri:

| Polje | Vrijednost |
|-------|------------|
| **Framework Preset** | Vite |
| **Root Directory** | `client` (važno – klikni "Edit" i stavi `client`) |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `dist` (default) |

### Korak 3.4: Environment Variable za API

Prije **Deploy** dodaj varijablu:

1. Otvori **"Environment Variables"**.
2. **Name:** `VITE_API_URL`
3. **Value:** URL tvog backend-a **bez** kosé crte na kraju, npr.  
   `https://bookseeker-api.onrender.com`
4. Odaberi Environment: **Production** (i opcionalno Preview).
5. Spremi.

Zatim klikni **"Deploy"**.

### Korak 3.5: Gotovo

Kad se deploy završi, Vercel će dati link tipa:

**https://bookseeker-xxx.vercel.app**

Taj link otvori u pregledniku – ili na mobitelu. Aplikacija tada koristi backend s Rendera i radi online.

---

## Sažetak – što si napravila

| Što | Gdje | URL (primjer) |
|-----|------|----------------|
| Kod projekta | GitHub | https://github.com/TVOJ_USERNAME/BookSeeker |
| Backend (API) | Render | https://bookseeker-api.onrender.com |
| Stranica (aplikacija) | Vercel | https://bookseeker-xxx.vercel.app |

- **Na mobitelu:** otvori link s Vercela u browseru – aplikacija radi isto kao na računalu.
- **Za projekt/GitHub:** u README ili u opisu repozitorija stavi link na live aplikaciju (Vercel URL).

---

## Napomene

- **Render free tier** – backend može “usnuti” nakon neaktivnosti; prvi zahtjev nakon toga može biti spor (20–30 s), pa se strpi.
- **Google Books kvota** – i online vrijede dnevni limitovi; ako ih prekoračiš, aplikacija koristi Open Library i fallback kao lokalno.
- **Biblioteka (spremljene knjige)** – na Renderu se podaci spremaju na disk koji se može resetirati na free tieru. Za trajno spremanje trebalo bi kasnije dodati bazu (npr. bazu na Renderu ili drugi servis) – za školski projekt je u redu i ovako.

Ako negdje zapneš, napiši koji korak radiš i što točno vidiš (poruka, screenshot) pa možemo točno dotjerati.
