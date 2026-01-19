# Pre-Deployment Checklist

Complete this checklist before deploying to Vercel.

## Backend Setup ✓

- [ ] `BE/package.json` created with all dependencies
- [ ] `BE/api/server.js` - Express server configured
- [ ] `BE/api/middleware/auth.js` - JWT middleware created
- [ ] All route files created:
  - [ ] `BE/api/routes/auth.js` - Login/Register
  - [ ] `BE/api/routes/posts.js` - Posts CRUD
  - [ ] `BE/api/routes/comments.js` - Comments
  - [ ] `BE/api/routes/users.js` - User profiles
  - [ ] `BE/api/routes/favorites.js` - Favorites
  - [ ] `BE/api/routes/follow.js` - Follow system
  - [ ] `BE/api/routes/cycle.js` - Cycle tracking
- [ ] `BE/schema.sql` - Database schema created
- [ ] `BE/.env.example` - Environment template created
- [ ] `BE/.gitignore` - Git ignore configured
- [ ] Dependencies installed locally: `npm install` works
- [ ] Backend runs locally: `npm run dev` starts server
- [ ] Health check works: `curl http://localhost:5000/api/health`

## Frontend Setup ✓

- [ ] `FE/src/api/client.js` - API client created
- [ ] `FE/src/pages/Login.js` - Updated with API integration
- [ ] `FE/src/pages/Register.js` - Updated with API integration
- [ ] `FE/src/pages/Home.js` - Feed component exists
- [ ] `FE/.env.example` - Environment template created
- [ ] Dependencies installed locally: `npm install` works
- [ ] Frontend runs locally: `npm start` loads on localhost:3000
- [ ] Can navigate between pages
- [ ] API URL is configurable via environment variables

## Local Testing ✓

- [ ] Database created locally with schema
- [ ] User registration works with backend
- [ ] Login works and returns JWT token
- [ ] Token stored in localStorage
- [ ] Can create posts
- [ ] Can like/unlike posts
- [ ] Can add comments
- [ ] Can follow users
- [ ] Can add to favorites
- [ ] API returns proper error messages
- [ ] No console errors in browser
- [ ] No console errors in backend

## Vercel Configuration ✓

- [ ] `vercel.json` created and configured
- [ ] Build command is correct
- [ ] Output directory is correct
- [ ] Routes are configured properly
- [ ] Environment variable names are correct

## Database Preparation ✓

- [ ] Database provider chosen (Planet Scale, AWS RDS, Railway, etc.)
- [ ] Database account created
- [ ] Database connection details saved:
  - [ ] DB_HOST: _______________
  - [ ] DB_USER: _______________
  - [ ] DB_PASSWORD: _______________
  - [ ] DB_NAME: herchat
- [ ] Schema.sql tested locally
- [ ] Ready to run schema on production database

## Documentation ✓

- [ ] `SETUP_GUIDE.md` - Local setup instructions
- [ ] `DEPLOYMENT.md` - Deployment guide
- [ ] `VERCEL_DEPLOY_STEPS.md` - Step-by-step Vercel instructions
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] README includes quick start

## Security Checklist ✓

- [ ] Password hashing configured (bcryptjs)
- [ ] JWT_SECRET generated (use: `openssl rand -base64 32`)
- [ ] Environment variables not in code
- [ ] `.gitignore` includes `.env` files
- [ ] No sensitive data in repository
- [ ] CORS configured for production domain
- [ ] SQL queries are parameterized (no injection)

## Code Quality ✓

- [ ] No console.log() statements for debugging
- [ ] No hardcoded API URLs (using env variables)
- [ ] No hardcoded database credentials
- [ ] Error handling in all API routes
- [ ] Error handling in frontend API calls
- [ ] Loading states in frontend
- [ ] Input validation in backend
- [ ] Proper HTTP status codes used

## GitHub & Git ✓

- [ ] Repository is public/accessible
- [ ] All code committed: `git status` is clean
- [ ] Main branch is up to date
- [ ] No uncommitted changes
- [ ] `.gitignore` is configured

## Final Verification ✓

- [ ] All BE dependencies are in package.json
- [ ] All FE dependencies are in package.json
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Test account created and tested
- [ ] All main features work locally
- [ ] No "Cannot find module" errors
- [ ] Database tables exist and are populated

## Ready to Deploy! 🚀

If you've checked all boxes, you're ready to:

1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy!

See `VERCEL_DEPLOY_STEPS.md` for detailed instructions.

## Deployment Issues?

If something fails during deployment:

1. Check Vercel build logs for error messages
2. Verify environment variables are set correctly
3. Test database connection string
4. Ensure schema.sql was run on production database
5. Check that all API routes are working
6. Verify CORS settings

Refer to `DEPLOYMENT.md` troubleshooting section.

## Post-Deployment Tasks

After successful deployment:

- [ ] Test all features work on production
- [ ] Set up custom domain (optional)
- [ ] Configure analytics
- [ ] Set up monitoring
- [ ] Plan backup strategy
- [ ] Document any manual steps taken

---

**Last Updated**: January 19, 2025
**Status**: Ready for Vercel Deployment
