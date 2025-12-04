# BB Team – Student Planner

## 👥 Team Members
- Ivan Bobanac (ibobanac)
- Mate Blažević (mblazevic)

## 🧩 Project Overview
**Student Planner** omogućuje studentima:
- unos zadataka, ispita, rokova i napomena
- pregled obveza po danu, tjednu i mjesecu
- automatsko generiranje mjesečnog pregleda obveza
- označavanje izvršenih zadataka
- praćenje napretka kroz semestar
- organizaciju učenja po kolegijima

Na početku svakog mjeseca aplikacija generira **sažetak obveza** kako bi student imao jasnu sliku nad svojim rasporedom i ciljevima.

## 🧠 Project Motivation
Studenti često imaju mnogo obveza: kolokviji, ispiti, laboratorijske vježbe, rokovi za domaće zadatke i seminare. Većina koristi nekoliko različitih alata (papirnati planer, mobitel, Excel, bilješke).  
Student Planner sve to objedinjue u **jednostavno, pregledno i intuitivno sučelje**.

## ✨ Features (Planirane i Implementirane)

### ✔️ Implementirano / Osnovne funkcionalnosti
- Dodavanje i uređivanje obveza (taskova)
- Pregled obveza po kategorijama (ispiti, zadaci, rokovi, bilješke)
- Prikaz nadolazećih obveza
- Lokalno spremanje podataka (localStorage)

### 🚀 Planirane / Napredne funkcionalnosti
- Mjesečni automatski pregled ("Monthly Overview")
- Obavijesti i podsjetnici
- Napredna filtracija (po kolegiju, prioritetu, datumu)
- Gamifikacija – praćenje napretka uz "progress bar"
- Sinkronizacija s kalendarima (Google Calendar)
- Light/Dark tema
- Mobile-first dizajn

## 🛠️ Technologies
- **HTML5** – struktura aplikacije  
- **CSS3** – stilizacija i layout  
- **JavaScript** – funkcionalnost aplikacije  
- **GitHub** – verzioniranje i suradnja  
- (opcionalno) **LocalStorage / IndexedDB** – spremanje podataka  
- (opcionalno) **Firebase / backend** – za korisničke račune i sinkronizaciju 

## 🧩 System Architecture (pojednostavljeno)
index.html
│
├── /css
│ └── style.css
│
├── /js
│ ├── app.js # Glavna logika
│ ├── tasks.js # Upravljanje zadacima
│ ├── calendar.js # Kalendar i mjesečni pregled
│ └── storage.js # Spremanje podataka
│
└── /assets
└── icons, images

## 💡 Monthly Overview — Kako radi?

Na početku svakog mjeseca aplikacija:

1. Provjerava postoje li obveze iz prošlog mjeseca koje nisu izvršene  
2. Generira popis svih obveza unutar idućih 30 dana  
3. Grupira obveze po kolegiju  
4. Prikazuje:
   - najvažnije rokove
   - nadolazeće ispite
   - zadatke koji kasne
   - procijenjeno vrijeme učenja
5. Predlaže raspored učenja na temelju unesenih rokova
