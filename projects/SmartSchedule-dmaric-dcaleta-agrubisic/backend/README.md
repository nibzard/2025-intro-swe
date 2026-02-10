# Backend - Gemini AI Proxy

Ovaj folder sadrži Node.js Express server koji služi kao proxy za Gemini API.

## Instalacija

```bash
npm install
```

## Konfiguracija

Kreiraj `.env` datoteku sa varijablom:

```
GEMINI_API_KEY=your_api_key_here
```

## Pokretanje

```bash
node server.js
```

Server će biti dostupan na `http://localhost:3001`

## Endpoints

### POST `/gemini-proxy`

Primjer zahtjeva:

```javascript
const response = await fetch('http://localhost:3001/gemini-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Tvoje pitanje' })
});
const data = await response.json();
```

## Sigurnost

- AI ključ je spreman samo u `.env` datoteci na backendu
- Frontend **nikada** nema pristup ključu
- Svi zahtjevi sa frontenда prolaze kroz ovaj proxy
