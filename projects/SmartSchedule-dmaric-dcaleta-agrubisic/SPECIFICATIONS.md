# Specifikacije aplikacije SmartSchedule

## 1. Project Overview
*   **Project Name & Working Title: SmartSchedule**
*   **Version / Date: v0.1.0 Baseline** 
*   **High-Level Goal: Aplikacija omogućava brzu i jednostavnu izradu rasporeda i namijenjena je korisnicima svih uzrasta**
*   **Core Value Proposition: Rješava problem kombiniranja raznih obveza u privatnom ili poslovnom životu.**

## 2. Scope & Requirements
### 2.1 Goals (In-Scope)
*   *Mora biti jasna i laka za korištenje*
*   *Omogućiti promjenu tj. dodavanje novih osoba i događaja*
*   *Mora podržavati različite softvere*

### 2.2 Non-Goals (Out-of-Scope)
*   *Nema autentifikacije/izrade profila*
*   *Aplikacija ne pamti sve prošle rasporede*
*   *Nema mogućnost promjene nakon spremanja*

### 2.3 User Personas / Scenarios
*   * Studentica Ana u sljedećem mjesecu ima 4.ispita i 3 izlaska sa društvom.*
*   * Na početku mjeseca će sve svoje obveze upisati u aplikaciju te dobiti raspored u kojem se obveze međusobno ne preklapaju.*

## 3. Technical Architecture
### 3.1 Tech Stack & Rationale
*   **HTML - omogućava veliku slobodu pri izradi aplikacije**
*   **CSS - omogućava uređenje sučelja**  
*   **React - framework koji ispunjava sve potrebe za ovaj projekt** 

### 3.2 High-Level Architecture
*   Frontend -> React -> Prikaz rasporeda
*   mermaid diagram 

flowchart TD

A[Pokretanje aplikacije] --> B[Prikaz početnog izbornika]
B --> C{Odabir vrste rasporeda?}

%% POSLOVNI DIO
C --> D[Poslovne svrhe]
D --> E[Unos opisa rasporeda]
E --> F[Unos broja zaposlenika]
F --> G[Unos radnog vremena i zadataka]
G --> X[Slanje forme]

%% DRUŠTVENI DIO
C --> H[Društvene svrhe]
H --> I[Unos događaja ili aktivnosti]
I --> J[Unos zauzetih dana]
J --> K[Unos broja sudionika]
K --> X[Slanje forme]

%% ZAJEDNIČKI DIO
X --> L[AI analizira unesene podatke]
L --> M[Generiranje rasporeda i mogućnost uređivanja]
M --> N[Kraj procesa]

### 3.3 Project Directory Structure
*   A tentative layout of the folders and key files.
    ```text
	project_root/
  	├── src/
  	│   ├── App.jsx
  	│   ├── App.css
  	│   └── main.jsx
  	├── specifications.md
  	└── README.md
    ```

## 4. Data Design (The Domain Model)
*   **Core Entities:**
* Person (Osoba)-Predstavlja osobu kojoj se dodjeljuju obveze ili aktivnost.
* Event (Događaj / Obveza)-Predstavlja aktivnost koju treba smjestiti u raspored.
* Schedule (Raspored) -Predstavlja konačni generirani raspored koji se sastoji od niza događaja bez međusobnog preklapanja.
*   **Schema / Data Structure:**
	* JSON Schema — Person {
  "id": "string",
  "name": "string",
  "availability": ["2025-06-01T08:00", "2025-06-01T16:00"]
	}
	* JSON Schema — Event
	{
  "id": "string",
  "title": "string",
  "description": "string",
  "startTime": "2025-06-01T10:00",
  "endTime": "2025-06-01T12:00",
  "participants": ["personId1", "personId2"],
  "type": "business" | "social"
	}
	*JSON Schema — Schedule
	{
  "id": "string",
  "createdAt": "2025-06-01T09:00",
  "events": ["eventId1", "eventId2", "eventId3"],
  "isFinal": false
	}
*   **Storage Strategy:**
*Podaci se pohranjuju u memoriji aplikacije (React state).
*Nakon završetka — raspored se može izvesti u JSON dokument (download), ali se ne sprema trajno (jer je to izvan scope-a).

## 5. Interface Specifications

* **App.jsx:**
* Mogućnost odabira između poslovnog ili društvenog rasporeda.
* Forma za ispunu sa obvezama i dodatnim informacijama.
* Tipka za slanje zahtjeva za izradu rasporeda.


## 6. Functional Specifications (Module breakdown)
*   **Module A -Config Loader:**
*   Ispunjavanje forme i spremanje podatka
*   Validacija zapisa
*   Error handling za prazne podatke.
*   **Module B -The Processor:**
*   Dodavanje novih obveza.
*   Ispravak greški i sl.
*   Ažuriranje pregleda.
*   **Module C -The Reporter:** 
*   Prikazivanje HTML stranice

## 7. Development Plan & Milestones
*   **Milestone 1 (Skeleton):**
*   Izrada projekta.
*   Prikaz imena aplikacije.
*   **Milestone 2 (Core Logic):**
*   Izrada forme s informacijama i obvezama.
*   **Milestone 3 (Interface):**
*   Uređenje CSS-a.
*   Stiliziranje aplikacije
*   **Milestone 4 (Polish):**
*   Dokumentacija.
*   Bug fix.
*   **Definition of Done:**
*   Aplikacija točno prima i "čita" korisnikove zahtjeve.
*   Vraća izgled rasporeda koji zadovoljava uvjete.
*   Omogućava dodatnu promjenu prije samog spremanja.
*   Spremanje rasporeda u točnom formatu.

## 8. Testing & Quality Strategy
*   **Unit Tests:**
*   Dodavanje nove obveze -> točno se prikazuje na rasporedu.
*   Pokušaj dodavanja praznog podatka -> izbacuje error.

## 9. Future Improvements (Roadmap)
*   Dodavanje tamnog načina.
*   Sinkronizacije s  gmailom.

---