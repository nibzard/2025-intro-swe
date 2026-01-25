# Vercel Deployment - Step by Step

## Phase 1: Prepare Your Code (5 minutes)

### 1.1 Ensure Git is Ready
```bash
git status
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 1.2 Verify Project Structure
```bash
# Make sure you're in project root
ls -la
# Should see: BE/ FE/ vercel.json DEPLOYMENT.md SETUP_GUIDE.md Readme.md Specification.md
```

## Phase 2: Get Database Ready (10 minutes)

Choose one option:

### Option A: Planet Scale (Recommended - Free tier available)
1. Go to https://planetscale.com
2. Sign up with GitHub
3. Create new database called "herchat"
4. Create user with password
5. Get connection string
6. Save these credentials:
   - DB_HOST: `aws.connect.psdb.cloud`
   - DB_USER: `username`
   - DB_PASSWORD: `password`
   - DB_NAME: `herchat`

### Option B: Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Create MySQL database
4. Copy connection details
5. Save credentials

### Option C: AWS RDS
1. Go to AWS Console
2. Create MySQL instance
3. Note the endpoint, username, password
4. Save credentials

### Step: Initialize Database
```bash
# Using mysql command
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_PASSWORD -D herchat < BE/schema.sql

# Or paste the content of BE/schema.sql into your database provider's web console
```

Verify:
```bash
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_PASSWORD -D herchat
mysql> SHOW TABLES;
# Should see: users, posts, comments, favorites, follows, cycle_entries
mysql> exit
```

## Phase 3: Set Up Vercel Project (5 minutes)

### 3.1 Connect Repository
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Select your GitHub repository
5. Click "Import"

### 3.2 Configure Project
1. **Framework Preset**: Select "Other"
2. **Root Directory**: Keep as `/` (root of project)
3. **Build Command**: Leave default
4. **Output Directory**: Leave default
5. Click "Continue"

## Phase 4: Add Environment Variables (2 minutes)

In Vercel dashboard, go to **Settings → Environment Variables**

Add these variables:

| Name | Value | Notes |
|------|-------|-------|
| `DB_HOST` | Your database host | e.g., `aws.connect.psdb.cloud` |
| `DB_USER` | Your database user | e.g., `username` |
| `DB_PASSWORD` | Your database password | ⚠️ Keep secret |
| `DB_NAME` | `herchat` | Exact value |
| `JWT_SECRET` | Generate secure string | Run: `openssl rand -base64 32` |
| `NODE_ENV` | `production` | Exact value |
| `FRONTEND_URL` | Will update after deploy | For now: `https://YOUR_VERCEL_DOMAIN.vercel.app` |

### How to Add Variables:
1. Click "Add New"
2. Enter Name (e.g., `DB_HOST`)
3. Enter Value
4. Select "Production" checkbox
5. Click "Save"
6. Repeat for all variables

## Phase 5: Deploy! (2 minutes)

### 5.1 Initial Deploy
1. Click "Deploy" button
2. Wait for build to complete (5-10 minutes)
3. Once green checkmark appears, deployment is done
4. Copy your Vercel URL (e.g., `https://herchat.vercel.app`)

### 5.2 Update Frontend URL
1. Go back to **Settings → Environment Variables**
2. Update `FRONTEND_URL` with your actual Vercel domain
3. Redeploy:
   - Go to **Deployments**
   - Click the three dots on latest deployment
   - Select "Redeploy"

## Phase 6: Test Your Deployment (5 minutes)

### 6.1 Check API Health
```bash
curl https://YOUR_VERCEL_DOMAIN.vercel.app/api/health
# Should return: {"status":"ok","message":"HERChat API is running"}
```

### 6.2 Test Frontend
1. Open https://YOUR_VERCEL_DOMAIN.vercel.app
2. Register a new account
3. Login
4. Create a post
5. Like the post
6. Add a comment

### 6.3 Check API Calls
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Reload page
4. Check that API calls go to `/api/` endpoints
5. Look for 200 status codes (success)

## Phase 7: Troubleshooting

### Issue: "Database Connection Error"
```bash
# Check database credentials
# 1. Verify DB_HOST, DB_USER, DB_PASSWORD in Vercel
# 2. Test connection locally first
# 3. Ensure database allows Vercel IPs (usually automatic on Planet Scale)
```

### Issue: "API Not Responding"
```bash
# 1. Check Vercel build logs:
#    - Deployments → Click deployment → Logs
# 2. Look for error messages
# 3. Verify all environment variables are set
```

### Issue: "Frontend 404 Errors"
```bash
# 1. Check browser console for API URL errors
# 2. Verify REACT_APP_API_URL is correct
# 3. Redeploy frontend after updating env vars
```

### Issue: "CORS Errors in Browser"
```
Access to XMLHttpRequest blocked by CORS
```
Solution:
1. Verify `FRONTEND_URL` is set correctly in backend
2. Redeploy backend
3. Hard refresh browser (Ctrl+Shift+R)

### View Logs
```bash
# Via Vercel CLI
vercel logs https://herchat.vercel.app

# Or in dashboard:
# Deployments → Click deployment → Runtime Logs
```

## Phase 8: Post-Deployment Checklist

- [ ] Database has all 6 tables
- [ ] Can register new account
- [ ] Can login
- [ ] Can create post
- [ ] Can like post
- [ ] Can add comment
- [ ] Can view cycle tracker
- [ ] API health check returns 200
- [ ] No console errors in browser
- [ ] Email verification (optional for production)
- [ ] Configure custom domain (optional)

## Phase 9: Custom Domain (Optional)

1. Go to Vercel dashboard
2. Select project
3. Go to **Settings → Domains**
4. Add your domain
5. Update DNS records as instructed
6. Wait for DNS to propagate (can take up to 48 hours)

## Phase 10: Monitoring & Maintenance

### Weekly
- Check Vercel dashboard for errors
- Monitor database usage
- Review user feedback

### Monthly
- Update npm packages: `npm update`
- Review security advisories
- Back up database

### Production Best Practices
1. **Enable automatic deployments** (Vercel does by default)
2. **Set up alerts** for errors
3. **Monitor database** size and connections
4. **Keep dependencies updated**
5. **Use strong JWT_SECRET** (minimum 32 characters)
6. **Enable HTTPS** (Vercel does by default)
7. **Set up analytics** for usage tracking
8. **Schedule backups** of database

## Rollback (If Something Goes Wrong)

1. Go to **Deployments** in Vercel
2. Find previous good deployment
3. Click three dots → **Promote to Production**
4. Your previous version is now live

## Getting Help

### Vercel Docs
- https://vercel.com/docs
- https://vercel.com/docs/concepts/deployments/overview

### Common Issues & Solutions
- Check the **Logs** tab in Vercel dashboard
- Error message should indicate the problem
- Check environment variables are spelled correctly
- Ensure database schema exists with `SHOW TABLES;`

### Support Contacts
- Vercel Support: https://vercel.com/support
- Database Provider Support (Planet Scale, AWS, etc.)
- GitHub Issues in your repository

## Summary of Costs

| Service | Estimated Cost |
|---------|-------|
| Vercel | Free tier (generous) |
| Planet Scale MySQL | Free tier available |
| Custom Domain | $12/year |
| **Total** | **Free to start** |

That's it! Your HERChat app is now live on Vercel! 🎉

Questions? Check DEPLOYMENT.md for more details.
