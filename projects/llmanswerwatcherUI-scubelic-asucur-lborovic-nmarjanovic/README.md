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

