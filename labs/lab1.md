# Vodič za studente: Git, GitHub, CLI, GitHub Actions, Dev Containeri, Codespaces, Docker i mini-API igra

Ovaj handout sažima sadržaj s vježbi – od prvog **kloniranja repozitorija** do pokretanja **automatizacija** i **dev-okruženja**. Slijedite korak po korak i odradite zadatke na kraju svake sekcije.

---

## 1) Ciljevi učenja

* Razlikovati **Git** (sustav verzioniranja) i **GitHub** (platforma/usluga).
* Instalirati i koristiti **Git** i **GitHub CLI** (gh).
* Klonirati repozitorij, raditi **commit/push**, riješiti tipične konflikte.
* Postaviti i razumjeti **GitHub Actions** (periodične skripte).
* Pokrenuti standardizirano okruženje kroz **Dev Container** (lokalno i u **Codespaces**).
* Osnovno koristiti **Docker** za izolirano pokretanje aplikacija.
* Upoznati se s **AI coding agentima** u razvoju.
* Napraviti i pokrenuti jednostavan **FastAPI** backend (mini-igrica).

---

## 2) Git vs. GitHub (brza distinkcija)

* **Git**: lokalni alat za verzioniranje kôda (commit, branch, merge…).
* **GitHub**: mjesto gdje hostamo repozitorije, PR-ove, issue-e, Actions, Codespaces…
* **GitHub CLI (`gh`)**: komandna linija za **GitHub** (PR status, Issues, Actions) – *ne zamjenjuje Git*.

---

## 3) Instalacija (Windows/macOS/Linux)

### Git

* **Windows**: [git-scm.com] installer ili `winget install --id Git.Git -e --source winget`
* **macOS**: `brew install git` (ili Xcode Command Line Tools)
* **Linux**: `sudo apt install git` / `sudo dnf install git` (ovisno o distribuciji)

### GitHub CLI (`gh`)

* **Windows**: `winget install GitHub.cli`
* **macOS**: `brew install gh`
* **Prekompajlirani binarni paketi**: dostupni na GitHub Releases (ako ne koristite paket-manager).

### VS Code

* Instalirajte VS Code; u terminalu ćete moći koristiti `code .` za otvaranje trenutnog foldera.

### (Opcionalno) Docker Desktop / OrbStack

* **Windows/macOS**: Docker Desktop (besplatan za učenje).
* **macOS** alternativa: **OrbStack** – brza, ugodna opcija za kontejnere.

---

## 4) Brzi start: kloniranje i prvi commit

```bash
# 1) Kloniranje
git clone <URL_REPOZITORIJA>
cd <folder>

# 2) Otvori u VS Code
code .

# 3) Napravi datoteku i dodaj je u git
echo "Ovo je README" > README.md

git status             # vidi stanje
git add .              # stage svih promjena
git commit -m "Prvi commit: dodan README"
git push               # gura na udaljeni (origin/main)
```

**Tipični problem – “unrelated histories / non-fast-forward”:**
Najčešće kada je remote već imao sadržaj koji lokalno nemaš. Rješenja:

* `git pull --rebase origin main` pa ponovi `git push`, ili
* uskladi promjene kroz merge/rebase uz pomoć AI agenta ili mentora.

---

## 5) GitHub CLI – praktične naredbe

```bash
# Autentikacija
gh auth login

# PR-ovi
gh pr status
gh pr list
gh pr view <broj> --web

# Issues
gh issue list
gh issue view <broj> --web

# Actions
gh run list
gh run view <id> --log

# Repo radnje
gh repo create <ime> --public        # napravi repo
gh repo clone owner/repo             # kloniraj
```

**Zašto je korisno?**
AI agenti (ili vi) preko **gh** mogu čitati statuse, logove Actions-a, otvarati issue-e i PR-ove – bez klikanja po webu.

---

## 6) Dev Containeri i Codespaces

**Zašto?** Standardizirano, izolirano razvojno okruženje – svi rade “na istome”.

### Minimalni `devcontainer.json`

```json
{
  "name": "Python 3.11 Dev",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-toolsai.jupyter"
      ]
    }
  },
  "postCreateCommand": "pip install -r requirements.txt || true"
}
```

**Kako pokrenuti lokalno (VS Code):**

1. U repo dodaj `.devcontainer/devcontainer.json`.
2. VS Code → **Reopen in Container** (Command Palette: *Dev Containers: Rebuild and Reopen*).

**GitHub Codespaces:**

* Na stranici repozitorija → **Code → Codespaces → Create Codespace**.
* Dobijete isti VS Code u browseru, gradi se prema vašem `devcontainer.json`.

---

## 7) Docker – kratki uvod

* **Kontejner** = “malo računalo” s vlastitim paketima i alatima, izolirano od hosta.
* Sigurno za isprobavanje – ako “razbijete” okruženje, samo obrišete kontejner i pokrenete novi.

**Osnovne naredbe:**

```bash
# Preuzmi i pokreni sliku (web app primjer)
docker run -p 8080:8080 --name moja-app example/image:latest

# Popis kontejnera
docker ps        # aktivni
docker ps -a     # svi

# Zaustavi i obriši
docker stop moja-app
docker rm moja-app
```

---

## 8) AI coding agenti – kako pomažu

* **Explainability**: “Objasni mi projekt” (čitanje README-a, `package.json`, `pyproject.toml`…).
* **Pomoć pri dijagnostici**: čitanje logova Actions-a, pronalazak grešaka, prijedlozi fix-eva.
* **Automatizacija radnji**: generiranje datoteka, inicijalizacija projekta, testovi.

> Prakticirajte: zalijepite agentu grešku/stack-trace i **tražite plan i korak-po-korak fix**.

---

## 9) Mini projekt: FastAPI “Igrica timova” (backend-only)

**Cilj:** Minimalan API s endpointima:

* `POST /join` – registriraj igrača (ime jedinstveno).
* `POST /team` – kreiraj tim (max 2 člana).
* `POST /poach` – pokušaj “ukrasti” člana drugog tima (pravila ograničenja).
* `GET /state` – vrati stanje igre (igrači, timovi).

### Game Flow Analysis:
  1. Individual players join → become "free agents"
  2. Free agents can either create new teams OR join existing teams
  3. Teams have exactly 2 members max (creates scarcity and competition)
  4. Poaching allows active team stealing (creates dynamic gameplay)

### Strategic Considerations:
  - With 2-member teams, every player matters significantly
  - Poaching becomes a high-stakes action (can't poach from full teams)
  - Team creation vs joining creates interesting decision points
  - No "solo" play - encourages social interaction

> **Ideje za proširenje:** izbacivanje člana tima, bodovanje, persistencija (SQLite), testovi, rate-limiting.

---

## 10) Kreiranje novog GitHub repozitorija (sažetak)

1. GitHub → **+** → **New repository** → ime (npr. `test-repo`).
2. Odaberi **Public** ili **Private**.
3. (Preporuka) Dodaj **README**, **.gitignore** (npr. Python), i **LICENSE** (npr. MIT).
4. **Clone** lokalno i počni rad:

   ```bash
   git clone <URL>
   cd <repo>
   code .
   ```

---

## 11) Troubleshooting (brza lista)

* **`code .` ne radi:** provjeri da je VS Code dodao “code” u PATH (Command Palette → Shell Command: Install ‘code’ command).
* **Greške s permissions u Dev Containeru:** probaj *Rebuild Container*; provjeri da postoje očekivani folderi (npr. `data/`, `notebooks/` – postavi prazan `.gitkeep`).
* **Git push/pull konflikti:** koristi `git pull --rebase`, čitaj poruku, rješavaj merge u editoru.

> **Napomena:** koristite AI coding agente poput Gemini, Codex, Claude Code da popravite pogreške.

---

## 12) Zadaci za vježbu (obavezni)

1. **Kloniraj** repozitorij s nastave i otvori ga u **Codespaces**.
2. Lokalne kopije: pokreni **Dev Container** i potvrdi da su ekstenzije i alati instalirani.
3. **Napravi novi repo** i dodaj README u taj repo, napravi **commit** i **push**.
4. **Docker:** pokreni bilo koju javnu demo sliku (npr. hello-world ili jednostavnu web app) i pristupi joj kroz mapirani port. Npr. `docker run --rm -it -p 3000:3000 -p 9223:9223 ghcr.io/steel-dev/steel-browser:latest`
5. **FastAPI igra:** lokalno pokreni `uvicorn`, registriraj 2 igrača, kreiraj timove i testiraj.

### REPOZITORIJI:

- https://github.com/nibzard/2025-intro-swe/
- https://github.com/nibzard/student-projects
- https://github.com/nibzard/poachers

---

## 13) Povezanost s prezentacijom finalnog projekta

* Pokrenite projekt u **VS Code / Codespaces** (prikažite strukturu i `devcontainer.json`).
* Pokažite **Git povijest** (commiti s jasnim porukama).
* Kratko objasnite **arhitekturu** (backend, frontend, baza, etc.).
* Osvrnite se na ulogu **AI agenta** u vašem tijeku rada (što je predložio/fixao).

---

Sretno! Ako zapnete, zalijepite grešku AI agentu i tražite **plan + konkretne korake**. Iterirajte dok ne proradi.
