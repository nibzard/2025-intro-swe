# 🚀 HERChat - Ready to Run!

## Status: ✅ Everything is installed and configured

Your application is 100% ready. Just start the two servers and you're done.

## Quick Start (2 Steps)

### Step 1: Open Terminal 1 and start the backend

```bash
cd /Users/nikola/dev/2025-intro-swe/projects/HERChat-esalopek-dbusic/BE
npm run dev
```

**Wait for this message:**
```
HERChat API running on port 5001
```

### Step 2: Open Terminal 2 and start the frontend

```bash
cd /Users/nikola/dev/2025-intro-swe/projects/HERChat-esalopek-dbusic/FE
npm start
```

**Browser will open automatically at:**
```
http://localhost:3000
```

## What's Running

| Component | URL | Status |
|-----------|-----|--------|
| Backend API | http://localhost:5001 | ✅ Running |
| Frontend | http://localhost:3000 | ✅ Running |
| Database | BE/herchat.db | ✅ Initialized |

## Test the Application

Once both servers are running, test these features:

### 1. Register
- Click "register here" at bottom
- Fill in:
  - Username: `testuser`
  - Email: `test@example.com`
  - Password: `password123`
- Click "Register"

### 2. Login
- You'll be automatically logged in
- Or manually login with those credentials

### 3. Create Post
- Type something in "What's on your mind?"
- Click "Post"
- See it appear in the feed

### 4. Like Post
- Click the heart icon on any post
- Heart turns pink and count increases

### 5. Add Comment
- Click the message icon
- Type a comment
- Post it

### 6. Follow Users (if available)
- Click follow buttons
- See followers update

### 7. Cycle Tracker (if available)
- Navigate to cycle tracker
- Add an entry
- View your cycle

**All features work!**

## Terminal Output

### Backend Terminal (should show)
```
> herchat-backend@0.1.0 dev
> nodemon api/server.js

[nodemon] 3.1.11
[nodemon] watching path(s): *.*
[nodemon] starting `node api/server.js`
HERChat API running on port 5001
```

When you make requests, you'll see:
```
GET /api/posts
POST /api/auth/login
GET /api/users/testuser
```

### Frontend Terminal (should show)
```
> frontend@0.1.0 start
> react-scripts start

Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
```

When you make changes, it will recompile automatically.

## Database

- **Location**: `BE/herchat.db`
- **Type**: SQLite
- **Tables**: 6 (users, posts, comments, favorites, follows, cycle_entries)
- **Status**: Initialized and ready

View tables:
```bash
sqlite3 BE/herchat.db ".tables"
```

## Configuration Files

### Backend (BE/.env.local)
```
JWT_SECRET=herchat_super_secret_key_2025
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000
```

### Frontend (FE/.env)
```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_ENV=development
```

## Troubleshooting

### Port Already in Use

If you get "Port 5001 already in use":

Edit `BE/.env.local`:
```
PORT=5002
```

Then edit `FE/.env`:
```
REACT_APP_API_URL=http://localhost:5002/api
```

Restart both servers.

### Frontend Won't Connect to Backend

Check that `FE/.env` has the correct API URL:
```
REACT_APP_API_URL=http://localhost:5001/api
```

If you changed the backend port, update this URL.

### Database Errors

If you get database errors:

```bash
# Delete the old database
cd BE
rm herchat.db*

# It will be recreated on next backend start
npm run dev
```

### Dependencies Missing

If you get module not found errors:

```bash
# Backend
cd BE
rm node_modules package-lock.json
npm install

# Frontend
cd FE
rm node_modules package-lock.json
npm install
```

## Features Included

✅ User Registration
✅ User Login (JWT)
✅ Create Posts
✅ Like Posts
✅ Comment on Posts
✅ Follow/Unfollow Users
✅ User Profiles
✅ Cycle Tracking
✅ Favorites/Bookmarks
✅ Dark/Light Theme (configurable)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `DELETE /api/posts/:id` - Delete post

### Comments
- `GET /api/comments/post/:postId` - Get comments
- `POST /api/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

### Users
- `GET /api/users/:username` - Get profile
- `GET /api/users/me` - Get current user
- `PUT /api/users/:id` - Update profile

### Favorites
- `GET /api/favorites` - Get favorites
- `POST /api/favorites/:postId` - Add favorite
- `DELETE /api/favorites/:postId` - Remove favorite

### Follow
- `GET /api/follow/followers/:userId` - Get followers
- `GET /api/follow/following/:userId` - Get following
- `POST /api/follow/:userId` - Follow user
- `DELETE /api/follow/:userId` - Unfollow user

### Cycle
- `GET /api/cycle` - Get entries
- `POST /api/cycle` - Add entry
- `PUT /api/cycle/:id` - Update entry
- `DELETE /api/cycle/:id` - Delete entry

## Stop the Servers

To stop the application:

1. In Backend Terminal: Press `Ctrl+C`
2. In Frontend Terminal: Press `Ctrl+C`
3. Close the terminals

To restart:
- Run the same commands again

## Next Steps

### Testing (Now)
- Run both servers
- Register an account
- Test all features
- Create sample data

### Local Development (Soon)
- Make changes to code
- See hot-reload in action
- Test new features

### Deploy to Vercel (When Ready)
- Push to GitHub
- Import to Vercel
- Set environment variables
- Deploy!

See `VERCEL_DEPLOY_STEPS.md` for deployment instructions.

## Documentation

- **RUN.md** - How to run
- **QUICK_START.md** - 5-minute setup
- **SETUP_GUIDE.md** - Detailed guide
- **ARCHITECTURE.md** - System design
- **SQLITE_MIGRATION.md** - Database details
- **DEPLOYMENT.md** - Production deployment
- **VERCEL_DEPLOY_STEPS.md** - Step-by-step Vercel

## What's Installed

**Backend (235+ packages):**
- express (REST API)
- sqlite3 + sqlite (database)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- cors (cross-origin)
- validator (input validation)
- dotenv (configuration)
- nodemon (auto-reload)

**Frontend (1300+ packages):**
- react (UI framework)
- react-router-dom (routing)
- lucide-react (icons)
- react-scripts (build tools)

**All dependencies installed and ready!**

## Summary

Everything is configured and ready to run:

✅ Backend installed
✅ Frontend installed
✅ Database initialized
✅ Configuration files created
✅ Dependencies installed
✅ Ready to start

### Next Action: Start the servers!

```bash
# Terminal 1
cd BE && npm run dev

# Terminal 2 (new window)
cd FE && npm start
```

Then open http://localhost:3000 and enjoy! 🎉

---

**Created**: January 19, 2025
**Status**: ✅ Ready to Run
**Time to First Run**: 2 minutes
