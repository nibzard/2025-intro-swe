# 🚍 Promet Split – Studentski projekt mobilne aplikacije za javni prijevoz

Ovaj projekt predstavlja **prototip mobilne aplikacije Promet Split**, koja simulira funkcionalnosti stvarne aplikacije za gradski prijevoz u Splitu.  
Cilj projekta je popravak i razvoj mobilne aplikacije koja omogućuje korisnicima pregled voznog reda, planiranje putovanja te kupnju i aktivaciju autobusnih karata putem digitalnog sustava.

---

| Ime i prezime | Mail |
| --------------- | -------------------------------- |
| **Karlo Ćurčija** | kcurcija@pmfst.hr |
| **Ela Kević** | ekevic@pmfst.hr |
| **Lucija Tomić** | ltomic@pmfst.hr | (leader)
| **Jere Vitaljić** | jvitaljic@pmfst.hr |

---

## 🎯 Cilj projekta

- Napraviti prototip mobilne aplikacije koja **olakšava korištenje javnog prijevoza**.  
- Omogućiti **digitalnu kupnju i validaciju karata** putem QR koda.  
- Implementirati **real-time prikaz autobusa** pomoću GPS podataka.  
- Omogućiti **intuitivno korisničko sučelje** i jednostavnu navigaciju.  

---

## 🧩 Funkcionalnosti

- 🔍 Pregled voznog reda i stajališta  
- 🗺️ Planiranje putovanja (od polazne do krajnje stanice)  
- 💳 Kupnja i aktivacija karata (jednokratnih i pretplatnih)  
- 📱 Validacija karata putem QR koda u autobusu  
- 🚌 Prikaz autobusa i stanica u stvarnom vremenu  
- 🧾 Pregled povijesti kupljenih karata  
- ☎️ Kontakt s podrškom  

---

## 🧭 Dijagram toka aplikacije

```mermaid
flowchart TD
    A[Otvaranje aplikacije] --> B{Je li korisnik ulogiran?}
    B -- Ne --> C[Pregled vremena polazaka i stanica]
    B -- Da --> D[Pristup dodatnim opcijama profila]
    C --> E[Planiranje putovanja]
    D --> E
    E --> F{Kupovina karte/pokaza}
    F -- Dnevna karta --> G[Dodavanje novca u e-Novčanik]
    F -- Mjesečna/Godišnja karta --> H[Kupnja pokaza]
    G --> I[Aktivacija karte -> skeniranje QR koda]
    H --> I
    I --> J[Skeniranje karte prilikom ulaska u autobus]
    J --> K[Vožnja]
    K --> L[Pregled stanica u realnom vremenu]
    L --> M[Pomoć i korisnička podrška]
