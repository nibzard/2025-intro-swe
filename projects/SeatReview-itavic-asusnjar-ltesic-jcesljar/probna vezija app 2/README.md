
# Seat Review – MVP

Full-stack application for collecting and analyzing seat comfort reviews.

## How to run

### Backend

```bash
cd backend
npm install
cp .env.example .env   # na Windowsu ručno kopiraj
# upiši svoj OPENAI_API_KEY u .env (ili ostavi prazno ako ne želiš AI)
npm run dev
```

Backend će raditi na `http://localhost:5000`.

### Frontend

U drugom terminalu:

```bash
cd frontend
npm install
npm run dev
```

Frontend će raditi na `http://localhost:5173`.

Otvorite u browseru: `http://localhost:5173`.
