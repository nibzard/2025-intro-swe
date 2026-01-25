# HERChat - Setup & Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL database
- Git

### Local Development (5 minutes)

#### 1. Backend Setup
```bash
cd BE
npm install
cp .env.example .env.local

# Edit .env.local with your database credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=herchat
# JWT_SECRET=your_random_secret_key

npm run dev
# Backend runs on http://localhost:5000
```

#### 2. Database Setup
```bash
# Create database and tables
mysql -u root -p < BE/schema.sql

# Or if using a remote database, connect first then run schema
```

#### 3. Frontend Setup
```bash
cd FE
npm install
cp .env.example .env

# Edit .env
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_ENV=development

npm start
# Frontend runs on http://localhost:3000
```

### Test the Application

1. Open http://localhost:3000
2. Click "Register" and create a test account
3. Login with your credentials
4. Create a post, like it, add a comment
5. Try the cycle tracker

## Project Structure

```
HERChat/
├── BE/                          # Backend (Node.js + Express)
│   ├── api/
│   │   ├── server.js           # Main Express app
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT verification
│   │   └── routes/
│   │       ├── auth.js         # Login/Register
│   │       ├── posts.js        # Posts CRUD
│   │       ├── comments.js     # Comments
│   │       ├── users.js        # User profiles
│   │       ├── favorites.js    # Bookmarks
│   │       ├── follow.js       # Following/Followers
│   │       └── cycle.js        # Cycle tracking
│   ├── package.json
│   ├── schema.sql              # Database schema
│   ├── .env.example
│   └── .gitignore
│
├── FE/                          # Frontend (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js        # Login page
│   │   │   ├── Register.js     # Register page
│   │   │   └── Home.js         # Main feed
│   │   ├── api/
│   │   │   └── client.js       # API client
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── vercel.json                  # Vercel deployment config
├── DEPLOYMENT.md                # Deployment instructions
├── SETUP_GUIDE.md               # This file
├── Readme.md                    # Project overview
└── Specification.md             # Technical specification
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (returns JWT token)

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (requires token)
- `DELETE /api/posts/:id` - Delete post (requires token)

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `POST /api/comments` - Create comment (requires token)
- `DELETE /api/comments/:id` - Delete comment (requires token)

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/me` - Get current user (requires token)
- `PUT /api/users/:id` - Update profile (requires token)

### Favorites
- `GET /api/favorites` - Get user's favorites (requires token)
- `POST /api/favorites/:postId` - Add to favorites (requires token)
- `DELETE /api/favorites/:postId` - Remove from favorites (requires token)

### Follow
- `GET /api/follow/followers/:userId` - Get followers
- `GET /api/follow/following/:userId` - Get following list
- `POST /api/follow/:userId` - Follow user (requires token)
- `DELETE /api/follow/:userId` - Unfollow user (requires token)

### Cycle Tracking
- `GET /api/cycle` - Get user's cycle entries (requires token)
- `POST /api/cycle` - Add cycle entry (requires token)
- `PUT /api/cycle/:id` - Update cycle entry (requires token)
- `DELETE /api/cycle/:id` - Delete cycle entry (requires token)

## Database Schema

### Users
- id (int, primary key)
- username (varchar, unique)
- email (varchar, unique)
- password_hash (varchar)
- bio (text, optional)
- avatar_url (varchar, optional)
- theme (enum: 'light', 'dark')
- created_at, updated_at

### Posts
- id (int, primary key)
- user_id (int, foreign key)
- content (text)
- image_url (varchar, optional)
- created_at, updated_at

### Comments
- id (int, primary key)
- post_id (int, foreign key)
- user_id (int, foreign key)
- content (text)
- created_at, updated_at

### Favorites
- id (int, primary key)
- post_id (int, foreign key)
- user_id (int, foreign key)
- unique constraint on (post_id, user_id)

### Follows
- id (int, primary key)
- follower_id (int, foreign key)
- following_id (int, foreign key)
- unique constraint on (follower_id, following_id)

### Cycle Entries
- id (int, primary key)
- user_id (int, foreign key)
- date (date)
- period_start (boolean)
- notes (text, optional)
- unique constraint on (user_id, date)

## Authentication Flow

1. **Register**: Username + Email + Password → Backend hashes password + creates JWT token
2. **Login**: Email + Password → Backend verifies + returns JWT token
3. **Protected Routes**: Frontend includes token in Authorization header
4. **Verification**: Backend middleware verifies token is valid & not expired

Token expires after 7 days.

## Environment Variables

### Backend (.env.local)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=herchat
JWT_SECRET=your_secret_key
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## Common Tasks

### Adding a New API Route

1. Create new file in `BE/api/routes/`
2. Use Express router and middleware pattern
3. Add JWT verification where needed
4. Export router and import in `server.js`

Example:
```javascript
const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Your logic
    res.json({ data: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

### Updating Frontend Component

1. Import `apiClient` from `../api/client`
2. Use async/await to call API
3. Store token in localStorage on login
4. Include token in all authenticated requests (apiClient handles this)

Example:
```javascript
import { apiClient } from '../api/client';

async function fetchPosts() {
  try {
    const posts = await apiClient.getPosts();
    setPosts(posts);
  } catch (err) {
    setError(err.message);
  }
}
```

## Debugging

### Backend Issues
```bash
# Check logs
cd BE
npm run dev

# Test specific endpoint
curl -X GET http://localhost:5000/api/posts

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/posts
```

### Frontend Issues
- Check browser console (F12)
- Check Network tab to see API calls
- Check localStorage for token: `localStorage.getItem('token')`

### Database Issues
```bash
# Connect to database
mysql -u root -p herchat

# Check tables
SHOW TABLES;

# Check data
SELECT * FROM users;
SELECT * FROM posts;
```

## Production Deployment

See `DEPLOYMENT.md` for full instructions.

Quick summary:
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Set up MySQL database
5. Deploy
6. Initialize database schema in production

## Performance Tips

- Frontend uses React Router v5 for client-side routing
- Backend uses connection pooling for database
- Posts are limited to 50 in feed (pagination in future)
- Token stored in localStorage (could upgrade to secure cookie)

## Security Considerations

- Passwords hashed with bcryptjs
- JWT tokens expire after 7 days
- CORS configured for allowed origins
- SQL injection prevented with parameterized queries
- Add rate limiting in production
- Add input validation (currently basic)
- Use HTTPS in production
- Set secure cookie flags

## Future Improvements

- [ ] Add email verification on signup
- [ ] Implement password reset
- [ ] Add image upload to cloud storage
- [ ] Implement real-time notifications
- [ ] Add private messaging
- [ ] Create mobile app
- [ ] Add hashtag search
- [ ] Implement recommendation algorithm
- [ ] Add admin dashboard
- [ ] Set up automated testing

## Support

For issues:
1. Check logs in backend/frontend
2. Verify database connection
3. Ensure environment variables are set
4. Check that ports are not in use
5. Clear browser cache and localStorage

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and test locally
3. Commit with clear message: `git commit -m "Add feature description"`
4. Push to branch: `git push origin feature/feature-name`
5. Create Pull Request

## License

MIT

## Authors

- Danijela Busic (@busicdanijela)
- Emma Salopek (@emmasalopek)
