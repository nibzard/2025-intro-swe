# Budgetly - Expense Tracker

Aplikacija za praćenje troškova s React frontendom i Node.js backendom.

## Preduvjeti

- Node.js (v18+)
- npm
- MongoDB Atlas account (ili lokalna MongoDB instanca)

## Pokretanje projekta

### 1. Backend

```bash
cd backend
npm install
```

Kreiraj `.env` datoteku prema `.env.example`:

```env
MONGO_URI="your_mongodb_connection_string"
JWT_SECRET="your_jwt_secret"
PORT=8000
GROQ_API_KEY="your_groq_api_key"
```

Pokreni server:

```bash
npm run dev
```

Backend će biti dostupan na `http://localhost:8000`

### 2. Frontend

```bash
cd frontend/expense-tracker
npm install
npm run dev
```

Frontend će biti dostupan na `http://localhost:5173`

## Tehnologije

### Backend
- Express.js
- MongoDB + Mongoose
- JWT autentifikacija
- Multer (upload datoteka)

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Recharts (grafovi)
- Axios
