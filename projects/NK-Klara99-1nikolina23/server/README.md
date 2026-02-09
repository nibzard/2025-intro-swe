# Travel Planner Server

Backend API for enriching trip planning with real data.

## Setup

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Create `.env` file:**
```bash
cp .env.example .env
```

3. **Add API keys:**
   - **Geoapify**: https://www.geoapify.com/ (free tier: 3000 requests/day)
   - **YouTube**: https://console.cloud.google.com/ (free tier: 300 requests/day)

4. **Run server:**
```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

Server runs on `http://localhost:3001`

## Endpoints

- `GET /health` - Health check
- `GET /api/places?destination=Madrid&type=restaurant` - Nearby places
- `GET /api/flights?origin=Split&destination=Madrid&startDate=2025-05-15&endDate=2025-05-21&people=2` - Flight estimates
- `GET /api/videos?destination=Madrid` - Travel videos
- `GET /api/enrich?destination=Madrid&origin=Split&startDate=2025-05-15&endDate=2025-05-21&people=2` - All combined

## Environment Variables

```
GEOAPIFY_API_KEY=xxx
YOUTUBE_API_KEY=xxx
PORT=3001
```

## Frontend Integration

Update Supabase calls to use server API:

```javascript
// Instead of mock chatbot, call backend
const flights = await fetch(
  `http://localhost:3001/api/flights?origin=Split&destination=Rome...`
);
```

## Deployment

Deploy to Vercel, Railway, or Render with environment variables set.
