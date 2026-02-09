# 🚀 Deployment Guide: Railway + Vercel

This guide will help you deploy your Classic Albums Archive app with:
- **Railway**: Backend (FastAPI + PostgreSQL)
- **Vercel**: Frontend (Static HTML/CSS/JS)

---

## 📋 Prerequisites

1. GitHub account
2. Railway account (https://railway.app) - Sign up with GitHub
3. Vercel account (https://vercel.com) - Sign up with GitHub
4. Spotify API credentials (optional, for album fetching)

---

## Part 1: Deploy Backend to Railway 🚂

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Prepare for deployment"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will auto-detect it's a Python project

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create and link the database automatically

### Step 4: Configure Environment Variables

In Railway, go to your service → **Variables** tab and add:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=your-super-secret-key-change-this-in-production-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SPOTIFY_CLIENT_ID=your-spotify-client-id-here
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret-here
PORT=8000
```

**Important Notes:**
- `DATABASE_URL` will auto-populate from PostgreSQL service
- Generate a strong `SECRET_KEY` (use: `openssl rand -hex 32`)
- Spotify credentials are optional but recommended for auto-fetching albums

### Step 5: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Wait for build to complete (2-3 minutes)
3. Click **"Generate Domain"** to get your public URL
4. Your backend will be at: `https://your-app-name.up.railway.app`

### Step 6: Test Backend

Visit:
- `https://your-app-name.up.railway.app/` - Should show welcome message
- `https://your-app-name.up.railway.app/docs` - API documentation

**Copy your Railway backend URL - you'll need it for Vercel!**

---

## Part 2: Deploy Frontend to Vercel 🔺

### Step 1: Update Frontend API URL

1. Open `frontend/app.js`
2. Find line 1: `const API_BASE_URL = 'http://localhost:8000/api/v1';`
3. Replace with your Railway URL:

```javascript
const API_BASE_URL = 'https://your-app-name.up.railway.app/api/v1';
```

4. Commit and push:
```bash
git add frontend/app.js
git commit -m "Update API URL for production"
git push
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty (we handle it in vercel.json)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
5. Click **"Deploy"**

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /workspaces/hiphop-api
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: classic-albums-archive
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Step 3: Verify Deployment

1. Vercel will give you a URL: `https://your-app.vercel.app`
2. Visit the URL and test:
   - Albums should load
   - Registration/Login should work
   - Random albums on refresh
   - Filters should work

---

## 🔧 Troubleshooting

### Backend Issues

**Database connection errors:**
- Check that `DATABASE_URL` variable is set in Railway
- Verify PostgreSQL service is running

**Albums not loading:**
- Check Railway logs: Click your service → "Deployments" → Latest deployment → "View Logs"
- Ensure Spotify credentials are set (optional but recommended)

**CORS errors:**
- Make sure your Railway URL is correct in frontend
- Backend already has CORS enabled for all origins

### Frontend Issues

**API calls failing:**
- Verify the `API_BASE_URL` in `frontend/app.js` matches your Railway URL
- Check browser console for errors (F12)

**Still showing localhost:**
- Clear browser cache (Ctrl+Shift+R)
- Verify you pushed the updated `app.js` to GitHub
- Redeploy on Vercel

---

## 📊 Post-Deployment

### Monitor Your Apps

**Railway:**
- View logs: Project → Service → Deployments → View Logs
- Monitor resources: Project → Service → Metrics

**Vercel:**
- Analytics: Project → Analytics
- Deployment logs: Project → Deployments → Latest → Function Logs

### Update Environment Variables

**Railway:**
1. Go to your service → Variables
2. Add/edit variables
3. Redeploy automatically happens

**Vercel:**
1. Project Settings → Environment Variables
2. Add variables (if needed for frontend)
3. Redeploy from Deployments tab

### Database Management

**Access Railway PostgreSQL:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Connect to database
railway connect postgres
```

**Run migrations:**
```bash
# SSH into Railway service or run locally with production DATABASE_URL
alembic upgrade head
```

---

## 💰 Costs

### Railway (Free Tier)
- $5 free credits per month
- PostgreSQL included
- Auto-sleeps after inactivity
- Upgrade to Hobby ($5/month) for always-on

### Vercel (Free Tier)
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains
- Perfect for static frontend

---

## 🎯 Next Steps

1. ✅ Set up custom domain (optional)
   - Railway: Settings → Domains
   - Vercel: Settings → Domains

2. ✅ Enable HTTPS (automatic on both platforms)

3. ✅ Set up continuous deployment
   - Push to GitHub = Auto-deploy on both platforms

4. ✅ Monitor and optimize
   - Check Railway metrics
   - Monitor Vercel analytics

---

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/

**Your app is now live! 🎉**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.up.railway.app`
- API Docs: `https://your-app.up.railway.app/docs`
