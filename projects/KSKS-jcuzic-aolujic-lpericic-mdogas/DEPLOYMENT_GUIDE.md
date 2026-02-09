# 🚀 Deployment Guide - Classic Albums API

## Quick Setup

Your project is in a subdirectory, so deployment needs special configuration.

---

## Option 1: Railway Backend (Recommended)

### Step 1: Push to GitHub
```bash
# Already done! Your code is at:
# https://github.com/augistin97/2025-intro-swe
```

### Step 2: Deploy on Railway

1. Go to **https://railway.app**
2. **New Project** → **Deploy from GitHub repo**
3. Select: `augistin97/2025-intro-swe`

### Step 3: Configure Root Directory

⚠️ **IMPORTANT**: Railway needs to know your project is in a subdirectory.

**In Railway Dashboard:**
- Click your service → **Settings**
- Scroll to **Root Directory**
- Set to: `projects/KSKS-jcuzic-aolujic-lpericic-mdogas`
- Save

### Step 4: Add PostgreSQL

- In your Railway project, click **+ New**
- Select **Database** → **PostgreSQL**
- Railway will auto-link it

### Step 5: Environment Variables

Click your service → **Variables** → Add:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=<generate-random-32-char-string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SPOTIFY_CLIENT_ID=<optional-your-spotify-id>
SPOTIFY_CLIENT_SECRET=<optional-your-spotify-secret>
```

**Generate SECRET_KEY:**
```bash
openssl rand -hex 32
```

### Step 6: Deploy

- Railway will automatically deploy
- Wait 2-3 minutes
- Click **Generate Domain** to get your URL
- Your API: `https://your-app.up.railway.app`
- API Docs: `https://your-app.up.railway.app/docs`

---

## Option 2: Vercel Frontend

### Step 1: Update API URL

Edit `frontend/app.js` line 1:
```javascript
const API_BASE_URL = 'https://your-railway-app.up.railway.app/api/v1';
```

Commit and push:
```bash
cd projects/KSKS-jcuzic-aolujic-lpericic-mdogas
git add frontend/app.js
git commit -m "Update API URL for production"
git push origin main
```

### Step 2: Deploy on Vercel

**Via Vercel Dashboard:**
1. Go to **https://vercel.com/dashboard**
2. **Add New...** → **Project**
3. Import: `augistin97/2025-intro-swe`
4. **Configure:**
   - Root Directory: `projects/KSKS-jcuzic-aolujic-lpericic-mdogas/frontend`
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
5. **Deploy**

**Via Vercel CLI:**
```bash
npm install -g vercel
cd projects/KSKS-jcuzic-aolujic-lpericic-mdogas
vercel --cwd frontend
```

### Step 3: Test

Visit your Vercel URL (e.g., `https://your-app.vercel.app`)

---

## Alternative: Render.com (Easier for Subdirectories)

### Backend on Render

1. **https://dashboard.render.com** → **New** → **Web Service**
2. Connect GitHub: `augistin97/2025-intro-swe`
3. **Settings:**
   - Name: `classic-albums-api`
   - Root Directory: `projects/KSKS-jcuzic-aolujic-lpericic-mdogas`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables:** (same as Railway)
5. **Create Web Service**

Render automatically handles subdirectories better than Railway!

---

## Troubleshooting

### Railway Issues

**"No Procfile found"**
- Make sure Root Directory is set to: `projects/KSKS-jcuzic-aolujic-lpericic-mdogas`

**"Module not found"**
- Check that `requirements.txt` is in the root directory (it is!)
- Verify DATABASE_URL is set

### Vercel Issues

**"404 Not Found"**
- Verify Root Directory points to frontend folder
- Check that API_BASE_URL in `app.js` is correct

### Database Connection

**"Could not connect to database"**
- Ensure PostgreSQL service is running
- Check DATABASE_URL variable is set correctly
- Format: `postgresql://user:password@host:port/dbname`

---

## Free Tier Limits

- **Railway**: $5/month free credits (includes PostgreSQL)
- **Vercel**: 100GB bandwidth/month
- **Render**: 750 hours/month (sleeps after inactivity)

---

## 🎯 Quick Start Commands

```bash
# Test locally first
cd projects/KSKS-jcuzic-aolujic-lpericic-mdogas
pip install -r requirements.txt
uvicorn app.main:app --reload

# In another terminal
cd projects/KSKS-jcuzic-aolujic-lpericic-mdogas/frontend
python -m http.server 8080
```

Visit:
- Frontend: http://localhost:8080
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Need Help?

Check the main DEPLOYMENT.md for more details or ask your team! 🎵
