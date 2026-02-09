# 🚀 Deployment Checklist

## Before You Start
- [ ] GitHub account created
- [ ] Railway account created (sign up at railway.app)
- [ ] Vercel account created (sign up at vercel.com)
- [ ] Spotify API credentials (optional but recommended)

## Backend (Railway)
- [ ] Push code to GitHub repository
- [ ] Create new Railway project from GitHub repo
- [ ] Add PostgreSQL database to Railway project
- [ ] Configure environment variables in Railway:
  - [ ] DATABASE_URL (auto-populated)
  - [ ] SECRET_KEY (generate with: `openssl rand -hex 32`)
  - [ ] ALGORITHM=HS256
  - [ ] ACCESS_TOKEN_EXPIRE_MINUTES=30
  - [ ] SPOTIFY_CLIENT_ID (optional)
  - [ ] SPOTIFY_CLIENT_SECRET (optional)
- [ ] Wait for Railway deployment to complete
- [ ] Generate public domain in Railway
- [ ] Test backend: Visit `/docs` endpoint
- [ ] **Copy your Railway URL!** You'll need it for frontend

## Frontend (Vercel)
- [ ] Update `frontend/app.js` line 1 with Railway backend URL
- [ ] Commit and push changes to GitHub
- [ ] Create new Vercel project from GitHub repo
- [ ] Deploy with default settings (vercel.json handles config)
- [ ] Wait for Vercel deployment to complete
- [ ] Test frontend: Visit Vercel URL
- [ ] Test functionality:
  - [ ] Albums load and show randomly on refresh
  - [ ] Registration works
  - [ ] Login works
  - [ ] Filters work
  - [ ] Artists section works
  - [ ] Producers section works

## Post-Deployment
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Test all features end-to-end
- [ ] Share your live URLs! 🎉

## Your Live URLs
- Frontend: `https://______.vercel.app`
- Backend: `https://______.up.railway.app`
- API Docs: `https://______.up.railway.app/docs`

## Troubleshooting
If something doesn't work:
1. Check Railway logs (Project → Service → View Logs)
2. Check Vercel deployment logs
3. Verify API_BASE_URL in frontend/app.js
4. Check browser console for errors (F12)
5. Verify environment variables are set correctly
