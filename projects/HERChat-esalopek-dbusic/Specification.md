# ✅ **ENGINEERING SPECIFICATION – HERChat (v0.1.0 Baseline)**

---

## **1. Project Overview**

### **Project Name & Working Title:**

**HERChat – Social & Cycle Tracking Platform for Women**

### **Version / Date:**

v0.1.0 (Initial Engineering Spec)

### **High-Level Goal:**

HERChat je web aplikacija namijenjena ženama koja kombinira društvenu mrežu i praćenje menstrualnog ciklusa. Korisnicama pruža siguran prostor za dijeljenje objava, praćenje zdravlja, međusobnu podršku i izgradnju zajednice.

### **Core Value Proposition:**

Rješava nedostatak sigurnih online prostora za žene i povezuje društvenu mrežu s alatima za praćenje ciklusa – jedinstveno rješenje koje trenutno ne postoji.

---

## **2. Scope & Requirements**

### **2.1 Goals (In-Scope)**

✔ Registracija i prijava korisnica (JWT)
✔ Uređivanje osobnog profila (slika, bio, interesi)
✔ Objavljivanje postova i slika
✔ Komentiranje i reagiranje
✔ Dodavanje objava u favorite
✔ Praćenje drugih korisnica
✔ Personalizirani feed
✔ AI preporuke sadržaja (osnovni algoritam)
✔ Praćenje menstrualnog ciklusa + podsjetnici
✔ Sigurna pohrana podataka
✔ Pregled statistika
✔ Dark/Light tema

---

### **2.2 Non-Goals (Out-of-Scope)**

❌ Privatne poruke (chat)
❌ Push notifikacije
❌ Napredno pretraživanje, hashtagovi
❌ Mobilna aplikacija (iOS/Android)
❌ Forum sekcija
❌ Offline način rada

---

### **2.3 User Personas / Scenarios**

**Sara, 24 – studentica**
Želi motivaciju, zajednicu i jednostavan ciklus tracker.

**Iva, 33 – zaposlena mama**
Želi praćenje ciklusa i pregled sadržaja žena koje prati.

---

## **3. Technical Architecture**

### **3.1 Tech Stack & Rationale**

**Frontend:**

- React
- HTML
- CSS
- JavaScript

➡ jednostavno, bez frameworka, dovoljno za MVP.

**Backend:**

- **Node.js + Express**
  ➡ idealno za izgradnju REST API-ja.

**Database:**

- **MySQL**
  ➡ odličan za relacijske podatke: korisnice, postovi, komentari, follow sustav.

(Opcionalno ORM: Sequelize → možemo dodati ako želiš.)

**Authentication:**

- JWT

**Testing:**

- Postman (ručno testiranje API-ja)

---

### **3.2 High-Level Architecture**

```
Frontend (HTML/CSS/JS)
       |
       |   REST API
       v
Backend (Node.js + Express)
       |
       |   SQL Queries
       v
MySQL Database
```

---

### **3.3 Project Directory Structure**

```text
HERChat/
 ├── backend/
 │   ├── routes/
 │   ├── controllers/
 │   ├── middleware/
 │   ├── models/
 │   ├── config/
 │   └── server.js
 ├── frontend/
 │   ├── css/
 │   ├── js/
 │   ├── pages/
 │   └── index.html
 └── README.md
```

---

## **4. Data Design (The Domain Model)**

### **Table: User**

| polje         | tip                  |
| ------------- | -------------------- |
| id            | INT PK               |
| username      | VARCHAR              |
| email         | VARCHAR              |
| password_hash | VARCHAR              |
| bio           | TEXT                 |
| avatar_url    | VARCHAR              |
| theme         | ENUM('light','dark') |

---

### **Table: Post**

| polje      | tip      |
| ---------- | -------- |
| id         | INT PK   |
| user_id    | INT FK   |
| content    | TEXT     |
| image_url  | VARCHAR  |
| created_at | DATETIME |

---

### **Table: Comment**

| polje      | tip      |
| ---------- | -------- |
| id         | INT PK   |
| post_id    | INT FK   |
| user_id    | INT FK   |
| content    | TEXT     |
| created_at | DATETIME |

---

### **Table: Favorites**

| user_id | INT |
| post_id | INT |

---

### **Table: Follow**

| follower_id | INT |
| following_id | INT |

---

### **Table: CycleEntry**

| polje        | tip  |
| ------------ | ---- |
| id           | INT  |
| user_id      | INT  |
| date         | DATE |
| period_start | BOOL |
| notes        | TEXT |

---

## **5. Interface Specifications (API / Web App)**

| Metoda | Ruta                | Opis                 |
| ------ | ------------------- | -------------------- |
| POST   | /register           | Registracija         |
| POST   | /login              | Prijava              |
| GET    | /profile/:username  | Profil korisnice     |
| GET    | /posts              | Sve objave           |
| POST   | /posts              | Nova objava          |
| POST   | /posts/:id/comment  | Komentar             |
| POST   | /posts/:id/favorite | Dodavanje u favorite |
| POST   | /follow/:id         | Praćenje korisnice   |
| GET    | /feed               | Personalizirani feed |
| GET    | /cycle              | Pregled ciklusa      |
| PUT    | /cycle/update       | Ažuriranje ciklusa   |
| GET    | /recommendations    | **AI preporuke**     |
| PUT    | /profile/theme      | **Promjena teme**    |

---

## **6. Functional Specifications (Module breakdown)**

### **Module A – Authentication**

- validacija korisnika
- hashiranje lozinke
- generiranje JWT tokena

### **Module B – Posts & Comments**

- provjera dozvola
- validacija unosa
- spremanje slika (lokalno ili URL)

### **Module C – Feed**

- postovi korisnica koje pratimo
- sortiranje po datumu

### **Module D – Cycle Tracker**

- unos period_start
- izračun prosječnog ciklusa
- predikcija sljedeće menstruacije

### **Module E – Security**

- hashirane lozinke
- JWT middleware
- zaštita osjetljivih podataka

### **Module F – AI Recommendations**

- jednostavan algoritam temeljen na:

  - korisnicama koje pratiš
  - interesima
  - aktivnostima

### **Module G – Dark/Light Theme**

- zapis u user.theme
- backend sprema postavku
- frontend učitava css varijante

---

## **7. Development Plan & Milestones**

### **Milestone 1 – Backend skeleton + database**

- Node + Express setup
- MySQL povezivanje
- osnovne rute

### **Milestone 2 – Core Features**

- registracija + login
- postovi, komentari, favoriti

### **Milestone 3 – Social + Feed**

- follow sustav
- feed logika

### **Milestone 4 – Cycle Tracker**

- unos ciklusa
- izračun

### **Milestone 5 – Frontend**

- HTML/CSS/JS stranice
- profile
- feed
- ciklus tracker

### **Definition of Done**

- sve rute rade u Postmanu
- ciklus tracker funkcionalan
- AI preporuke rade na osnovnom levelu
- tema (dark/light) radi
- backend + frontend povezani

---

## **8. Testing & Quality Strategy**

- Jedinični testovi za backend logiku
- Postman testovi
- Testne baze i lažni podaci

---

## **9. Future Improvements (Roadmap)**

- Chat sustav
- Push notifikacije
- Hashtag pretraga
- Mobilna aplikacija
- Forum
