# 🧠 SmartSchedule

### Autori
- **Domina Marić Banje**
- **Domagoj Čaleta**
- **Antonio Grubišić Ćabo**

### Status projekta
📌 In Progress

---

## 📝 Opis projekta

**SmartSchedule** je aplikacija osmišljena kako bi korisnicima svih uzrasta omogućila jednostavno, brzo i inteligentno planiranje rasporeda.  
Zahvaljujući integraciji AI alata, aplikacija automatski kreira rasporede koji u potpunosti odgovaraju korisnikovim željama i uvjetima.

---

## ⚙️ Princip rada

Po pokretanju aplikacije korisniku se prikazuje početni izbornik s dvije osnovne opcije:
- Izrada rasporeda za **poslovne svrhe**
- Izrada rasporeda za **društvene svrhe**

Nakon odabira željene kategorije, korisnik ispunjava jednostavnu formu koja uključuje:
- Kratki opis rasporeda  
- Specifične uvjete (npr. vrijeme za pauzu u poslovnim rasporedima ili zauzete dane u društvenim rasporedima)

Nakon što korisnik pošalje formu, **SmartSchedule** uz pomoć ugrađenog AI sustava analizira unesene podatke i automatski generira optimalan raspored koji zadovoljava sve zadane kriterije.  
Dobiveni raspored moguće je dodatno prilagoditi prema osobnim preferencijama.

---

## 🎯 Cilj projekta

Glavni cilj projekta **SmartSchedule** je razviti intuitivno i pametno rješenje koje korisnicima omogućuje učinkovitu organizaciju vremena.  
Aplikacija nastoji pojednostaviti proces planiranja, smanjiti stres povezan s organizacijom te povećati produktivnost i ravnotežu između poslovnog i privatnog života.

Kombinacijom jednostavnog korisničkog sučelja i naprednih AI funkcionalnosti, **SmartSchedule** predstavlja moderan pristup planiranju vremena prilagođen potrebama suvremenog korisnika.

---

## 🧩 Dijagram rada (Mermaid)

```mermaid
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
