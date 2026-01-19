# 🚀 HERChat - Ready to Run!

## Status: ✅ Everything Installed & Configured

All dependencies are installed and the database is initialized!

### Current Configuration

```
Frontend:  http://localhost:3000
Backend:   http://localhost:5001
Database:  BE/herchat.db (SQLite)
```

## Run the Application

### Terminal 1: Start Backend

```bash
cd BE
npm run dev
```

You should see:
```
> herchat-backend@0.1.0 dev
> nodemon api/server.js

HERChat API running on port 5001
```

### Terminal 2: Start Frontend (new terminal window)

```bash
cd FE
npm start
```

You should see:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
```

### Open in Browser

Navigate to: **http://localhost:3000**

## Test the Application

1. **Register** a new account
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`

2. **Login** with those credentials

3. **Create a Post**
   - Write something in "What's on your mind?"
   - Click "Post"

4. **Like the Post**
   - Click the heart icon

5. **Add a Comment**
   - Click the message icon
   - Type a comment

6. **Follow a User**
   - Click profile (if available)

7. **Track Your Cycle**
   - Go to cycle tracker
   - Add an entry

All features should work!

## Database

- **File**: `BE/herchat.db`
- **Tables**: 
  - users
  - posts
  - comments
  - favorites
  - follows
  - cycle_entries

The database is automatically initialized and ready to use.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)

### Comments
- `GET /api/comments/post/:postId` - Get comments
- `POST /api/comments` - Add comment (auth required)
- `DELETE /api/comments/:id` - Delete comment (auth required)

### Users
- `GET /api/users/:username` - Get profile
- `GET /api/users/me` - Get current user (auth required)
- `PUT /api/users/:id` - Update profile (auth required)

### Favorites
- `GET /api/favorites` - Get favorites (auth required)
- `POST /api/favorites/:postId` - Add favorite (auth required)
- `DELETE /api/favorites/:postId` - Remove favorite (auth required)

### Follow
- `GET /api/follow/followers/:userId` - Get followers
- `GET /api/follow/following/:userId` - Get following
- `POST /api/follow/:userId` - Follow user (auth required)
- `DELETE /api/follow/:userId` - Unfollow user (auth required)

### Cycle Tracking
- `GET /api/cycle` - Get entries (auth required)
- `POST /api/cycle` - Add entry (auth required)
- `PUT /api/cycle/:id` - Update entry (auth required)
- `DELETE /api/cycle/:id` - Delete entry (auth required)

## Test API with curl

```bash
# Check health
curl http://localhost:5001/api/health

# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get all posts
curl http://localhost:5001/api/posts
```

## Troubleshooting

### Port Already in Use

If port 5001 is in use:
1. Edit `BE/.env.local` and change `PORT=5001` to another port
2. Edit `FE/.env` and update `REACT_APP_API_URL` to match

### Database Issues

If you get database errors:
```bash
# Reset database
cd BE
rm herchat.db*
npm run init-db
```

### Frontend Won't Connect

Check that `FE/.env` has correct API URL:
```
REACT_APP_API_URL=http://localhost:5001/api
```

### Clear Cache

```bash
# Clear npm cache if packages aren't updating
cd BE && rm -rf node_modules package-lock.json && npm install
cd ../FE && rm -rf node_modules package-lock.json && npm install
```

## Features Implemented

- ✅ User registration & login
- ✅ Posts (create, read, delete)
- ✅ Comments on posts
- ✅ Like/bookmark posts
- ✅ Follow/unfollow users
- ✅ User profiles
- ✅ Cycle tracking
- ✅ JWT authentication
- ✅ Password hashing
- ✅ SQLite database

## Environment Files

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

## Next Steps

### Local Testing
- ✅ Run both servers
- ✅ Test all features
- ✅ Create sample data

### Deploy to Vercel
When ready to deploy:
1. Push to GitHub
2. Import to Vercel
3. Set JWT_SECRET as environment variable
4. Deploy!

See `VERCEL_DEPLOY_STEPS.md` for details.

## Documentation

- `QUICK_START.md` - 5-minute setup
- `SETUP_GUIDE.md` - Detailed guide
- `ARCHITECTURE.md` - System design
- `SQLITE_MIGRATION.md` - Database migration info
- `DEPLOYMENT.md` - Deployment guide

## Ready to Go! 🎉

Everything is set up. Just run the two commands above and enjoy!

---

**Created**: January 19, 2025
**Status**: ✅ Ready to Run
**Last Updated**: Just Now
