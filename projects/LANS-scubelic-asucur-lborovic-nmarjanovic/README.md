<<<<<<< HEAD
# LLM Answer Watcher – UI Nadogradnja  

##  Uvod i predstavljanje problema

U današnje vrijeme, sve više organizacija želi pratiti kako se njihovi brendovi, proizvodi ili usluge pojavljuju u odgovorima velikih jezičnih modela (LLM-ova).  
Na primjer: kada korisnik postavi pitanje poput *"Koji su najbolji alati za XYZ?"*, model može spomenuti određeni brend – ili ga uopće ne spomenuti – što ima veliki značaj za vidljivost, konkurentnost i reputaciju.

Projekt **[LLM Answer Watcher](https://github.com/nibzard/llm-answer-watcher)** rješava taj problem kroz **CLI alat** koji:
- izvršava upite prema LLM-ovima i analizira pojavu brendova (spomen, pozicija, kontekst);
- sprema rezultate u **SQLite bazu** za praćenje kroz vrijeme;
- generira **HTML izvještaje** i omogućuje upravljanje putem komandne linije.

Iako CLI pristup omogućuje moćnu automatizaciju, on nije uvijek najpraktičniji za krajnje korisnike koji žele **vizualno** pratiti rezultate, filtrirati podatke, i brzo donositi zaključke.  
Zato je nastao ovaj projekt – **UI nadogradnja**.

---

##  Hipoteza i cilj projekta

> **Hipoteza:**  
> Ako se LLM Answer Watcher proširi intuitivnim grafičkim korisničkim sučeljem (UI), korisnici će lakše, brže i učinkovitije moći pratiti rezultate i donositi odluke.

**Ciljevi projekta:**
- Dodati **grafički sloj (frontend)** koji omogućuje pregled rezultata kroz web ili desktop sučelje.  
- Vizualizirati rezultate pomoću **grafova, tablica i filtera**.  
- Zadržati postojeću funkcionalnost originalnog CLI alata.  
- Osigurati **laganu integraciju**: UI komunicira s postojećim modulima, bez potrebe za ponovnim pisanjem jezgre alata.

---

##  Opseg nadogradnje

###  Frontend
Implementacija web aplikacije (npr. React, Vue ili Svelte) koja omogućuje korisniku da:
- učita konfiguracijski fajl (`watcher.config.yaml`);
- pokrene praćenje (ili učita postojeće rezultate);
- pregleda rezultate po **upitima, modelima, brendovima i datumima**;
- filtrira i sortira rezultate;
- vizualizira trendove (npr. promjene pozicije brenda kroz vrijeme);
- preuzme izvještaje u **HTML, PDF ili CSV** formatu.

###  Backend / Integracija
- povezuje UI s postojećim CLI funkcijama i SQLite bazom;
- omogućuje REST API sloj ili direktan pristup lokalnim fajlovima;
- (opcionalno) podržava pokretanje novih analiza iz UI-ja.

###  UX / UI dizajn
- jednostavan i pregledan raspored (dashboard s glavnim metrikama);
- jasna navigacija: *Pregled*, *Trendovi*, *Upiti*, *Brendovi*;
- naglasak na razumljivim vizualnim prikazima i intuitivnom korištenju.

---

##  Zašto ova nadogradnja?

- **Pristupačnost:** omogućuje korištenje alata i osobama bez CLI iskustva (npr. analitičari, marketinški timovi).  
- **Učinkovitost:** vizualni prikaz trendova omogućuje brže prepoznavanje promjena.
- **Vrijednost:** povećava upotrebljivost i dugoročni utjecaj originalnog projekta.

---


##  Arhitektura sustava

Mermaid dijagram:

flowchart TD
    User["User"]
    Config["watcher.config.yaml<br/>(models, brands, intents, budget)"]
    CLI["llm-answer-watcher CLI"]
    WebApp["User Interface<br/>"]
    Providers["LLM Providers"]
    Responses["LLM Responses"]
    Extraction["Brand<br/>Mention &amp; Rank Extraction"]
    SQLite["SQLite Database"]
    OutputDir["Output Directory"]
    HTMLReport["HTML Report"]
    Analysis["Historical &amp;<br/>Trend Analysis"]

    User -->|Configures| Config
    User -->|Browses/Triggers| WebApp
    Config -->|Runs CLI or triggers| CLI
    CLI -->|Sends queries| Providers
    Providers -->|Returns| Responses
    Responses --> Extraction
    Extraction --> SQLite
    Extraction --> OutputDir
    OutputDir --> HTMLReport
    SQLite --> Analysis
    HTMLReport --> WebApp
    Analysis --> WebApp
    SQLite --> WebApp
    WebApp -->|Displays| User

=======
# LLM Answer Watcher

LLM Answer Watcher je alat za praćenje spominjanja brendova u odgovorima velikih jezičnih modela (LLM). Omogućuje vam da vidite kako se vaši brendovi, proizvodi i usluge pozicioniraju u odnosu na konkurenciju u odgovorima na upite korisnika.

Ovaj projekt nadograđuje postojeći CLI (Command-Line Interface) alat s grafičkim korisničkim sučeljem (UI) za lakšu vizualizaciju i analizu podataka.

## Instalacija

### Opcija 1: Docker (preporučeno)

Najjednostavniji način pokretanja je korištenjem Dockera. Ova opcija automatski pokreće API server i web sučelje.

```bash
# Pokretanje s docker-compose
docker-compose up --build

# Ili u pozadini
docker-compose up -d --build
```

Nakon pokretanja:
- **Web UI**: http://localhost:3000
- **API**: http://localhost:8000

Za zaustavljanje:
```bash
docker-compose down
```

### Opcija 2: Ručna instalacija

Za pokretanje alata, potrebno je instalirati sve ovisnosti definirane u `requirements.txt` datoteci.

```bash
pip install -r requirements.txt
```

## Konfiguracija

Prije pokretanja, potrebno je izraditi konfiguracijsku datoteku. Možete kopirati priloženi primjer:

```bash
cp examples/default.config.yaml moja-konfiguracija.yaml
```

Zatim, uredite `moja-konfiguracija.yaml` i prilagodite je svojim potrebama. Ključni dijelovi za konfiguraciju su:

*   **`run_settings`**:
    *   `output_dir`: Direktorij u koji će se spremati rezultati.
    *   `sqlite_db_path`: Putanja do SQLite baze podataka za pohranu povijesnih podataka.
    *   `models`: Lista LLM modela koje želite koristiti. Potrebno je navesti `provider` (npr. `google`), `model_name` (npr. `gemini-1.5-flash`) i `env_api_key` (naziv varijable okruženja koja sadrži vaš API ključ).

*   **`brands`**:
    *   `mine`: Lista vaših brendova i njihovih aliasa.
    *   `competitors`: Lista konkurentskih brendova.

*   **`intents`**: Lista upita koje želite pratiti. Svaki upit ima `id` i `prompt` (tekst upita).

Primjer `moja-konfiguracija.yaml`:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"
  max_concurrent_requests: 10
  models:
    - provider: "google"
      model_name: "gemini-1.5-flash"
      env_api_key: "GEMINI_API_KEY"
      system_prompt: "google/default"

brands:
  mine:
    - "MojBrend"
    - "MojProizvod"
  competitors:
    - "KonkurentA"
    - "KonkurentB"

intents:
  - id: "usporedba-proizvoda"
    prompt: "Koji su najbolji alati za [kategorija]?"
  - id: "odluka-o-kupnji"
    prompt: "Koji [vrsta proizvoda] da odaberem?"
```

Prije pokretanja, ne zaboravite postaviti varijablu okruženja s vašim API ključem (npr. za Gemini):

```bash
export GEMINI_API_KEY=AIza...
```

## Pokretanje

Nakon što ste konfigurirali `moja-konfiguracija.yaml`, možete pokrenuti alat pomoću sljedeće naredbe:

```bash
llm-answer-watcher run --config moja-konfiguracija.yaml
```

Alat će izvršiti upite prema definiranim LLM modelima, analizirati odgovore i spremiti rezultate.

## Pregled Rezultata

Rezultati se spremaju u direktorij definiran u `output_dir` (npr. `./output`). Unutar tog direktorija, pronaći ćete:

*   **`watcher.db`**: SQLite baza podataka sa svim prikupljenim podacima.
*   **HTML izvještaje**: Za svaki pokrenuti `run`, generira se HTML datoteka s detaljnim izvještajem.
*   **Web-UI**: Pokretanjem `llm-answer-watcher ui` (funkcionalnost u razvoju), moći ćete pregledavati i analizirati rezultate kroz interaktivno web sučelje.
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
