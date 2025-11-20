# Aplikacija za rad u garderobi - Marijan Ević

**Projekt:** Aplikacija za rad u garderobi  
**Autor i izvođač:** Marijan Ević  
**Status:** In Progress  
**Kolegij:** Uvod u programsko inženjerstvo (PMFST)

## 🎯 Pregled projekta
Ova aplikacija pomaže garderobijerima folklornih ansambala u organizaciji i raspodjeli nošnji.  
Sustav omogućuje pregled plesača i dijelova nošnje, prikaz dostupnosti, optimalan odabir kompleta prema mjerama plesača i izvoz dokumenata za evidenciju nastupa i posudbi.

## 🧠 Cilj projekta
Cilj projekta je digitalizirati proces raspodjele nošnji i time olakšati rad garderobijera, smanjiti mogućnost pogreške i ubrzati pripremu nastupa.

## ⚙️ Funkcionalnosti
- Baza plesača (ime, visina, broj obuće)
- Baza nošnji i kompleta s veličinama
- Evidencija dostupnosti (dostupno, doma, pranje, šivanje)
- Preporuka optimalne nošnje za plesača
- Izvoz Excel tablice za nastupe
- Izvoz TXT potvrde za posudbu
- Evidencija povrata i promjene statusa nošnje

## 🛠 Tehnologije
- HTML, CSS, JavaScript (frontend)
- Node.js + Express (backend)
- SQLite (baza podataka)
- Mermaid za dijagrame
- XLSXWriter / FileSystem za izvoz datoteka

## 💻 Pokretanje projekta
1.  Klonirajte repozitorij:
    ```bash
    git clone https://github.com/evian126/2025-intro-swe.git
    cd 2025-intro-swe/projects/garderoba
    ```
2.  Postavite svoje okruženje:
    Koristite GitHub Codespaces ili Dev Container u lokalnom VS Code-u.

3.  Kreirajte vlastitu “feature” granu:
    ```bash
    git checkout -b feature/[naziv-funkcionalnosti]
    ```

 ## 📊  Dijagram sustava
   ```mermaid
graph TD;
    A[Garderobijer] --> B[Događaj]
    B --> C[Koreografija]
    C --> D[Plesač]
    D --> E[Dio nošnje]
    D --> F[Komplet]
    E --> G[Dostupnost]
    F --> G
    G --> H[Nošnja]
    H --> I[Izvještaj]
    D --> I


```
| Korak | Opis |
|---|---|
| Garderobijer → Događaj | Garderobijer odabire događaj (nastup, koncert, posudba). |
| Događaj → Koreografija | Definira koje se koreografije izvode. |
| Koreografija → Plesač | Definira koji plesač pleše. |
| Plesač → Dio nošnje | Definira koje pojedine dijelove nošnje dobiva  plesač. |
| Plesač → Komplet | Određuje koje komplete dobiva plesač. |
| Dio nošnje / Komplet → Dostupnost | Provjerava mogu li dijelovi nošnje i kompleti se upotrebljavati. |
| Dostupnost → Nošnja | Ukoliko je sve dostupno, nošnja se kompletira. |
| Plesač / Nošnja → Izvještaj | Definira se tko je dobio koju nošnju i podatke sprema u Excel ili TXT dokument. |
