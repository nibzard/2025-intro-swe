# SmartSchedule - Separirana arhitektura

Projekt je organiziran sa čistim odvajanjem: Backend (Node.js) i Frontend (čist HTML/CSS/JS).

## Struktura projekta

```
projekt_nibzar3/
├── backend/           (Node.js server + AI proxy)
│   ├── server.js      (Express proxy za Gemini API)
│   ├── test-openai.js (Test skripta)
│   ├── package.json
│   ├── package-lock.json
│   ├── .env           (GEMINI_API_KEY - ČUVAJ TAJNU!)
│   ├── .gitignore     (sprječava commit .env i node_modules)
│   ├── node_modules/
│   └── README.md      (Backend instrukcije)
│
└── SmartSchedule/     (Frontend - čist HTML/CSS/JS)
    ├── index.html
    ├── dashboard.html
    ├── business-create.html
    ├── business-final.html
    ├── personal.html
    ├── css/
    │   └── global.css
    ├── js/
    │   ├── auth.js
    │   ├── navigation.js
    │   ├── personal.js
    │   ├── schedules.js
    │   ├── utils.js
    │   └── api-key.js (prazan - sigurnost)
    └── README.md      (Frontend info)
```

## Brzi početak

### 1️⃣ Backend - pokreni AI proxy

```bash
cd backend
npm install          # Samo prvi put
node server.js       # Pokreći server
```

Očekivani output:
```
[dotenv@17.2.3] injecting env (1) from .env
Gemini proxy listening on http://localhost:3001
```

### 2️⃣ Frontend - otvori u pregledniku

Otvoriti `SmartSchedule/index.html` u web pregledniku, ili:

```bash
# Python 3
python -m http.server 8000 -d SmartSchedule

# ili Node.js
cd SmartSchedule && npx http-server . -p 8000
```

Zatim otvori `http://localhost:8000` u pregledniku.

## Arhitektura

```
┌─────────────────┐
│    Frontend     │  (Browser - HTML/CSS/JS)
│  SmartSchedule  │  
└────────┬────────┘
         │
         │ fetch('http://localhost:3001/gemini-proxy')
         │
         ▼
┌─────────────────┐
│    Backend      │  (Node.js Express)
│  Gemini Proxy   │  
└────────┬────────┘
         │
         │ Gemini API Key (u .env)
         │
         ▼
┌─────────────────┐
│  Gemini API     │
│   (Google AI)   │
└─────────────────┘
```

## Sigurnost ✔️

✅ **Frontend** - Nikada ne vidi AI ključ  
✅ **Backend** - Čuva ključ u `.env` datoteci  
✅ **.gitignore** - `.env` se ne commit-a u Git  
✅ **CORS** - Backend omogući zahtjeve sa frontenда

## Zavisnosti

### Backend (`package.json`)
- `express` ^5.2.1 - Web framework
- `cors` ^2.8.5 - Cross-Origin requests
- `dotenv` ^17.2.3 - Environment variables
- `node-fetch` ^3.3.2 - Fetch API za Node.js

### Frontend
- **Nema zavisnosti** - Čist vanilla JavaScript

## Razvoj

**Frontend promjene**: Direktno editiraj HTML/CSS/JS u `SmartSchedule/`  
**Backend promjene**: Editiraj datoteke u `backend/`, sačuva će se pri sljedećem `node server.js`  

## Troubleshooting

### "Cannot find module 'express'"
```bash
cd backend && npm install
```

### "GEMINI_API_KEY is undefined"
Provjeri da `.env` datoteka postoji u `backend/` sa validnim ključem:
```
GEMINI_API_KEY=AIzaSy...
```

### "CORS error" ili "localhost:3001 refused connection"
Sigurno je da je backend pokrenut:
```bash
cd backend && node server.js
```

