# BookSeeker – rad na fork-u i Pull Request profesoru

Ovaj vodič objašnjava **korak po korak** kako staviti svoju aplikaciju BookSeeker na **svoj GitHub**, na **forkani repozitorij** koji si forkala od profesora, napraviti **branch** (npr. BookSeeker) i **Pull Request** za profesora.

---

## Kako to sve funkcionira (ukratko)

1. **Fork** = kopija profesorovog repozitorija na tvom GitHub računu. Ti radiš samo u svojoj kopiji.
2. **Branch** = grana u tom repozitoriju (npr. `BookSeeker`). Tvoj kod ide na tu granu, da ne miješaš s `main` dok ne pošalješ PR.
3. **Pull Request (PR)** = zahtjev profesoru: "Evo moj kod na branchu BookSeeker, možeš pregledati i (ako želiš) spojiti u svoj repozitorij."

Profesor vidi tvoj fork, tvoj branch i tvoj PR; ne diraš izravno njegov repozitorij.

---

## Što ti treba unaprijed

- Račun na GitHubu.
- Fork profesorovog repozitorija (već ga imaš).
- Projekt BookSeeker na računalu (mapa na Desktopu).

**Provjeri s profesorem (ako nije rekao):**
- U koji **branch** njegovog repozitorija treba ići PR? (npr. `main` ili `submission`.)
- Treba li cijeli BookSeeker biti u **korijenu** repozitorija ili u **podmapi** (npr. `BookSeeker/`)?  
  U nastavku pretpostavljam: cijeli projekt u korijenu i PR na `main`.

---

## Korak 1: Otvori svoj fork na GitHubu

1. Ulogiraj se na **github.com**.
2. Otvori **svoj fork** profesorovog repozitorija (npr. `tvoje-korisnicko-ime/ime-repozitorija`).
3. Provjeri da vidiš repozitorij (može biti prazan ili s nekim početnim sadržajem).

---

## Korak 2: Lokalno – poveži mapu BookSeeker s fork-om

Tvoja mapa BookSeeker na Desktopu mora biti povezana s **tvojim fork-om** na GitHubu (ne s profesorovim izvornim repozitorijem).

### 2.1 Otvori terminal u mapi BookSeeker

- Put do mape: npr. `C:\Users\JA\OneDrive\Desktop\BookSeeker`.
- U Cursoru: **File → Open Folder** → odaberi BookSeeker, zatim **Terminal → New Terminal**.

### 2.2 Je li već postavljen Git?

U terminalu upiši:

```bash
git status
```

- Ako piše **"not a git repository"** – u repozitorij još nisi. Nastavi na **2.3**.
- Ako piše nešto poput "On branch main" ili "On branch master" – Git je već tu. Preskoči na **2.4**.

### 2.3 Inicijaliziraj Git (samo ako nisi u 2.2)

```bash
git init
```

### 2.4 Poveži s fork-om (remote)

Zamijeni:
- `TVOJ_GITHUB_USERNAME` → tvoje GitHub korisničko ime  
- `IME_REPOZITORIJA` → točno ime forkanog repozitorija (kako piše u URL-u forka)

Jedna naredba:

```bash
git remote add origin https://github.com/TVOJ_GITHUB_USERNAME/IME_REPOZITORIJA.git
```

Ako ti kaže da `origin` već postoji i želiš ga zamijeniti:

```bash
git remote remove origin
git remote add origin https://github.com/TVOJ_GITHUB_USERNAME/IME_REPOZITORIJA.git
```

Provjera:

```bash
git remote -v
```

Trebaš vidjeti `origin` koji pokazuje na tvoj fork (tvoj username, ime forkanog repozitorija).

---

## Korak 3: Napravi branch "BookSeeker" i stavi na njega sav kod

### 3.1 Dodaj sve datoteke

```bash
git add .
```

### 3.2 Provjeri što ide u commit

```bash
git status
```

Ne bi trebalo biti `server/.env` (zbog .gitignore). Ako jest, nemoj ga dodavati (ne stavljaj API ključeve na GitHub).

### 3.3 Prvi commit

```bash
git commit -m "BookSeeker - AI pretraga knjiga po opisu"
```

### 3.4 Preimenuj granu u "BookSeeker" (opcionalno, ali često traženo)

Ako si na `main` ili `master` i želiš da sav kod bude na branchu **BookSeeker**:

```bash
git branch -M BookSeeker
```

(Sada je tvoja trenutna grana zapravo `BookSeeker`.)

### 3.5 Pošalji branch na GitHub (svoj fork)

```bash
git push -u origin BookSeeker
```

(GitHub će možda zatražiti prijavu. Ako traži lozinku, koristi **Personal Access Token** umjesto obične lozinke – GitHub → Settings → Developer settings → Personal access tokens.)

Kad ovo prođe, na tvom fork-u na GitHubu postoji branch **BookSeeker** sa cijelim projektom.

---

## Korak 4: Otvori Pull Request za profesora

1. Otvori u pregledniku **svoj fork** repozitorija na GitHubu.
2. GitHub često prikaže žutu traku: **"BookSeeker had recent pushes"** i gumb **"Compare & pull request"**. Klikni **"Compare & pull request"**.
   - Ako to ne vidiš: klikni **"Pull requests"** → **"New pull request"**.
3. Postavi **base** i **compare**:
   - **base repository:** profesorov repozitorij (npr. `profesor-username/ime-repozitorija`).
   - **base branch:** branch u koji profesor želi primiti rad (npr. `main` ili `submission` – ovo provjeri s njim).
   - **head repository:** tvoj fork (`tvoje-ime/ime-repozitorija`).
   - **compare branch:** `BookSeeker`.
4. Naslov PR-a: npr. **"BookSeeker - [Tvoje ime]"**.
5. U opisu možeš napisati kratko: npr. "Projekt BookSeeker – AI pretraga knjiga po opisu. Branch: BookSeeker."
6. Klikni **"Create pull request"**.

Nakon toga profesor vidi tvoj PR, može pregledati kod i (ako želi) spojiti ga u svoj repozitorij.

---

## Sažetak redoslijeda

| Redoslijed | Što radiš |
|------------|-----------|
| 1 | Fork profesora (već imaš). |
| 2 | Lokalno: u mapi BookSeeker `git init` (ako treba), `git remote add origin` na **tvoj fork**. |
| 3 | `git add .` → `git commit -m "..."` → branch preimenuj u `BookSeeker` (`git branch -M BookSeeker`). |
| 4 | `git push -u origin BookSeeker` → kod je na branchu BookSeeker u tvom fork-u. |
| 5 | Na GitHubu: New Pull Request → base: profesorov repo + branch, compare: tvoj fork + branch BookSeeker → Create pull request. |

---

## Česta pitanja

**Mogu li imati i `main` i `BookSeeker`?**  
Da. Možeš ostaviti `main` prazan ili s početnim sadržajem, a sav BookSeeker kod držati na `BookSeeker`. PR onda šalješ s `BookSeeker` na profesorov `main` (ili kako on kaže).

**Što ako profesor kaže "pushaj na main"?**  
Onda nakon commita ne radiš `git branch -M BookSeeker`, nego ostaneš na `main` i radiš:

```bash
git push -u origin main
```

I PR može biti s tvojeg `main` na njegov `main` (ili kako on navedee).

**Što ako u fork-u već ima neki kod od profesora?**  
Ako treba da tvoj BookSeeker **zamijeni** sadržaj (ili bude u podmapi), prvo u mapi BookSeeker dovuci fork:

```bash
git fetch origin
git checkout -b BookSeeker origin/main
```

Zatim obriši sve datoteke osim `.git` i stavi svoj BookSeeker sadržaj, pa `git add .`, `git commit`, `git push origin BookSeeker`.  
Ako treba da BookSeeker bude u **podmapi** (npr. `BookSeeker/`), stavi cijelu sadržaj projekta u tu podmapu, pa `add` i `commit` kao gore.

**Kako provjeriti da ne šaljem .env?**  
Prije `git add .` provjeri:

```bash
git status
```

U listi ne smije biti `server/.env`. Ako jest, u `.gitignore` treba redak `server/.env` ili `.env`; zatim `git add .` i ponovno `git status`.

---

Ako ti profesor ima drugačije upute (ime brancha, base branch, jedan repozitorij po studentu), prilagodi korake: važno je da **remote** uvijek pokazuje na **tvoj fork**, a PR šalješ s **tvojeg brancha** na **profesorov repozitorij i branch** koje on traži.
