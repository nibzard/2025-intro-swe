# HERChat Deployment Guide

## Prerequisites

- Node.js 18+
- Vercel CLI (`npm install -g vercel`)
- MySQL database (Planet Scale, AWS RDS, or similar)
- GitHub account with repository

## Step 1: Set Up Database

1. Create a MySQL database instance (recommended: Planet Scale, AWS RDS, or Railway)
2. Run the schema from `BE/schema.sql` to set up tables
3. Save your database credentials:
   - DB_HOST
   - DB_USER
   - DB_PASSWORD
   - DB_NAME (should be "herchat")

## Step 2: Local Development & Testing

### Backend Setup
```bash
cd BE
npm install
cp .env.example .env.local
# Edit .env.local with your database credentials
npm run dev
```

### Frontend Setup
```bash
cd FE
npm install
cp .env.example .env
# Edit .env with backend URL (http://localhost:5000/api for dev)
npm start
```

Visit http://localhost:3000 to test locally.

## Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Select "Other" as Framework Preset
5. Set root directory to `/`
6. Add environment variables in Settings:
   - `DB_HOST`: Your database host
   - `DB_USER`: Your database user
   - `DB_PASSWORD`: Your database password
   - `DB_NAME`: herchat
   - `JWT_SECRET`: Generate a random secure string (e.g., `openssl rand -base64 32`)
   - `NODE_ENV`: production
   - `FRONTEND_URL`: Your deployed Vercel URL

7. Deploy!

### Option B: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add DB_HOST
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add JWT_SECRET
vercel env add NODE_ENV
vercel env add FRONTEND_URL

# Deploy
vercel deploy --prod
```

## Step 4: Configure Frontend Environment

After deployment, update the frontend build:

1. Set the API URL environment variable to your deployed backend
2. Rebuild and redeploy frontend

## Step 5: Database Initialization

Once deployed, run the schema.sql on your production database:

```bash
# Using mysql CLI
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DB < BE/schema.sql

# Or use your database provider's web interface to run the SQL
```

## Environment Variables Summary

| Variable | Purpose | Example |
|----------|---------|---------|
| DB_HOST | Database host | db.example.com |
| DB_USER | Database user | root |
| DB_PASSWORD | Database password | secure_password |
| DB_NAME | Database name | herchat |
| JWT_SECRET | JWT signing secret | random_secure_string |
| NODE_ENV | Environment | production |
| FRONTEND_URL | Frontend URL for CORS | https://herchat.vercel.app |

## Troubleshooting

### Database Connection Issues
- Verify credentials are correct
- Check if your database allows connections from Vercel IPs
- Ensure firewall rules allow access

### API Not Working
- Check environment variables are set
- Review Vercel function logs in dashboard
- Test API endpoints manually with curl or Postman

### Frontend Not Loading
- Verify build succeeded
- Check that REACT_APP_API_URL is set correctly
- Look at browser console for errors

### CORS Errors
- Ensure FRONTEND_URL is set correctly in backend env
- Verify frontend is making requests to correct API URL

## Database Recommendations for Production

- **Planet Scale**: Free tier available, excellent for MySQL
- **AWS RDS**: Reliable, scaling options
- **Railway**: Easy setup, good free tier
- **Supabase**: PostgreSQL alternative (would require code changes)

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions
2. Add monitoring and logging
3. Implement automated backups
4. Set up custom domain
5. Configure security headers
6. Add rate limiting
7. Implement email verification

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check Node.js/Express documentation
- Review application logs in Vercel dashboard
