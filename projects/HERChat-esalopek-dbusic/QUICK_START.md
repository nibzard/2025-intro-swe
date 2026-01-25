# HERChat - Quick Start (5 Minutes)

## Clone & Install

```bash
# You already have the code, so just install dependencies
cd BE
npm install
cd ../FE
npm install
cd ..
```

## Database Setup

✅ **No setup needed!** SQLite creates the database automatically.

The database file `herchat.db` will be created in the BE folder on first run.

## Configure Environment

### Backend
```bash
cd BE
cp .env.example .env.local
# Edit .env.local (only JWT_SECRET needed):
# JWT_SECRET=any_random_string
```

### Frontend
```bash
cd FE
cp .env.example .env
# .env is already configured for local dev
```

## Run Locally

### Terminal 1 - Backend
```bash
cd BE
npm run dev
# Runs on http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd FE
npm start
# Opens http://localhost:3000
```

## Test It

1. Open http://localhost:3000
2. Click "Register"
3. Create account (use any email/password)
4. Login
5. Create a post
6. Like it
7. Add a comment

## Deploy to Vercel

See `VERCEL_DEPLOY_STEPS.md` for step-by-step instructions.

Quick version:
1. Push to GitHub
2. Go to vercel.com
3. Import repository
4. Add environment variables (DB credentials, JWT_SECRET)
5. Deploy!

---

**That's it!** For more details, see:
- `SETUP_GUIDE.md` - Full setup guide
- `DEPLOYMENT.md` - Deployment details
- `VERCEL_DEPLOY_STEPS.md` - Vercel step-by-step
