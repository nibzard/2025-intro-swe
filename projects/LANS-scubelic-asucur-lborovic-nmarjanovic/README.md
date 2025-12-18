# LLM Answer Watcher

LLM Answer Watcher je alat za praćenje spominjanja brendova u odgovorima velikih jezičnih modela (LLM). Omogućuje vam da vidite kako se vaši brendovi, proizvodi i usluge pozicioniraju u odnosu na konkurenciju u odgovorima na upite korisnika.

Ovaj projekt nadograđuje postojeći CLI (Command-Line Interface) alat s grafičkim korisničkim sučeljem (UI) za lakšu vizualizaciju i analizu podataka.

## Instalacija

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
