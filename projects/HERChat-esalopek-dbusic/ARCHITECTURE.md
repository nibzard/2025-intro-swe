# HERChat - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐          ┌──────────────────┐       │
│  │   React Frontend │          │  Express Backend │       │
│  │   (FE/)         │          │  (BE/api/)      │       │
│  │                  │          │                  │       │
│  │ - Login Page     │◄────────►│ - Auth Routes    │       │
│  │ - Register Page  │ HTTPS    │ - Post Routes    │       │
│  │ - Home Feed      │          │ - Comment Routes │       │
│  │ - Cycle Tracker  │◄────────►│ - Follow Routes  │       │
│  │                  │ JSON     │ - Favorites      │       │
│  │ (Port 3000)      │          │ - Cycle Tracking │       │
│  │                  │          │                  │       │
│  │ Stored:          │          │ (Port 5000)      │       │
│  │ - JWT Token      │          │                  │       │
│  │ - User Data      │          │ Handles:         │       │
│  │                  │          │ - Authentication │       │
│  └──────────────────┘          │ - Authorization  │       │
│           │                    │ - Data Validation│       │
│           │                    │ - DB Queries     │       │
│           │                    │                  │       │
│           │                    └────────┬─────────┘       │
│           │                             │                 │
│           └─────────────────────────────┼─────────────────┼──┐
│                                         │                 │  │
└─────────────────────────────────────────┼─────────────────┘  │
                                          │                    │
                                          ▼                    │
                    ┌──────────────────────────────────┐       │
                    │    MySQL Database                │       │
                    │  (Planet Scale / AWS / Railway)  │       │
                    │                                  │       │
                    │ Tables:                          │       │
                    │ - users                          │       │
                    │ - posts                          │       │
                    │ - comments                       │       │
                    │ - favorites                      │       │
                    │ - follows                        │       │
                    │ - cycle_entries                  │       │
                    └──────────────────────────────────┘       │
                                                               │
               ┌──────────────────────────────────────────────┘
               │
          (Optional)
          Custom Domain
          (DNS)
```

## Data Flow

### 1. User Registration Flow

```
Frontend                          Backend                 Database
   │                                │                        │
   ├─ User enters credentials      │                        │
   ├──────────────── POST /auth/register ─────────────────►│
   │                                │                        │
   │                                ├─ Validate input       │
   │                                ├─ Hash password        │
   │                                ├─ Check if exists      │
   │                                ├──────────────────────►│
   │                                │  CREATE user           │
   │                                │◄──────────────────────┤
   │                                │                        │
   │                                ├─ Generate JWT token   │
   │◄──────────────── token + user data ──────────────────┤
   │                                │                        │
   ├─ Save token to localStorage   │                        │
   ├─ Redirect to /home            │                        │
```

### 2. Post Creation Flow

```
Frontend                          Backend                 Database
   │                                │                        │
   ├─ User writes post              │                        │
   ├─ Token in Authorization header │                        │
   ├──────── POST /posts (auth) ───►│                        │
   │   {content, image_url}         │                        │
   │                                ├─ Verify JWT token     │
   │                                ├─ Validate content     │
   │                                ├──────────────────────►│
   │                                │  INSERT post           │
   │                                │◄──────────────────────┤
   │◄───── post object + ID ────────┤                        │
   │                                │                        │
   ├─ Add post to feed             │                        │
   ├─ Show success message         │                        │
```

### 3. Feed Retrieval Flow

```
Frontend                          Backend                 Database
   │                                │                        │
   ├─ User visits /home             │                        │
   ├──────────── GET /posts ───────►│                        │
   │   (no auth needed)             │                        │
   │                                ├──────────────────────►│
   │                                │ SELECT * FROM posts   │
   │                                │ JOIN users            │
   │                                │ LEFT JOIN favorites   │
   │                                │ LEFT JOIN comments    │
   │                                │◄──────────────────────┤
   │◄───── array of posts ──────────┤                        │
   │                                │                        │
   ├─ Render posts                 │                        │
```

## Authentication Flow

```
┌────────────────────────────────────────────────┐
│         JWT Authentication System               │
├────────────────────────────────────────────────┤
│                                                │
│ 1. User Login                                  │
│    POST /auth/login                            │
│    Body: {email, password}                     │
│                                                │
│ 2. Backend Verification                        │
│    - Find user by email                        │
│    - Compare bcrypt(password)                  │
│    - Generate JWT token                        │
│    - Return {token, user}                      │
│                                                │
│ 3. Token Storage (Frontend)                    │
│    localStorage.setItem('token', token)        │
│                                                │
│ 4. Protected Request (Frontend)                │
│    Headers: {                                  │
│      'Authorization': 'Bearer <token>'         │
│    }                                           │
│                                                │
│ 5. Backend Verification                        │
│    - Extract token from header                 │
│    - Verify JWT signature                      │
│    - Extract user_id from token payload        │
│    - Proceed with request or reject            │
│                                                │
│ 6. Token Expiration                            │
│    - Expires after 7 days                      │
│    - User needs to login again                 │
│                                                │
└────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
users (1)─────────────(n) posts
  │ user_id PK           user_id FK
  │                          │
  │                          ├─(n) comments
  │                          │      post_id FK
  │                          │      user_id FK ──► users
  │                          │
  │                          └─(n) favorites
  │                                 post_id FK
  │                                 user_id FK ──► users
  │
  ├─(n) follows (as follower_id)
  │      follower_id FK ──┐
  │      following_id FK ─┴─► users
  │
  └─(n) cycle_entries
         user_id FK
```

## API Endpoint Organization

```
/api
├── /auth
│   ├── POST /register      - Create account
│   └── POST /login         - Login
│
├── /posts
│   ├── GET /               - All posts
│   ├── GET /:id            - Single post
│   ├── POST /              - Create post (auth)
│   └── DELETE /:id         - Delete post (auth)
│
├── /comments
│   ├── GET /post/:postId   - Post comments
│   ├── POST /              - Create comment (auth)
│   └── DELETE /:id         - Delete comment (auth)
│
├── /users
│   ├── GET /:username      - User profile
│   ├── GET /me             - Current user (auth)
│   └── PUT /:id            - Update profile (auth)
│
├── /favorites
│   ├── GET /               - User favorites (auth)
│   ├── POST /:postId       - Add to favorites (auth)
│   └── DELETE /:postId     - Remove from favorites (auth)
│
├── /follow
│   ├── GET /followers/:id  - Followers list
│   ├── GET /following/:id  - Following list
│   ├── POST /:userId       - Follow user (auth)
│   └── DELETE /:userId     - Unfollow user (auth)
│
├── /cycle
│   ├── GET /               - User entries (auth)
│   ├── POST /              - Add entry (auth)
│   ├── PUT /:id            - Update entry (auth)
│   └── DELETE /:id         - Delete entry (auth)
│
└── /health                 - API status check
```

## File Organization

```
HERChat/
│
├── Backend Files
│   ├── BE/api/
│   │   ├── server.js              - Main Express app
│   │   ├── middleware/
│   │   │   └── auth.js            - JWT verification
│   │   └── routes/
│   │       ├── auth.js            - Authentication
│   │       ├── posts.js           - Post management
│   │       ├── comments.js        - Comments
│   │       ├── users.js           - User profiles
│   │       ├── favorites.js       - Bookmarks
│   │       ├── follow.js          - Following system
│   │       └── cycle.js           - Cycle tracking
│   ├── BE/package.json            - Dependencies
│   ├── BE/.env.example            - Config template
│   └── BE/schema.sql              - Database schema
│
├── Frontend Files
│   ├── FE/src/
│   │   ├── api/
│   │   │   └── client.js          - API client
│   │   ├── pages/
│   │   │   ├── Login.js           - Login form
│   │   │   ├── Register.js        - Register form
│   │   │   └── Home.js            - Feed & dashboard
│   │   ├── App.js                 - Router
│   │   └── index.js               - Entry point
│   ├── FE/package.json            - Dependencies
│   └── FE/.env.example            - Config template
│
├── Deployment & Documentation
│   ├── vercel.json                - Vercel config
│   ├── DEPLOYMENT.md              - Deployment guide
│   ├── SETUP_GUIDE.md             - Setup instructions
│   ├── VERCEL_DEPLOY_STEPS.md     - Step-by-step
│   ├── PRE_DEPLOYMENT_CHECKLIST.md - Verification
│   ├── QUICK_START.md             - Quick reference
│   ├── ARCHITECTURE.md            - This file
│   └── WHAT_WAS_DONE.md           - Summary
│
└── Documentation
    ├── Readme.md                  - Project overview
    └── Specification.md           - Technical spec
```

## Technology Stack by Layer

```
┌────────────────────────────────┐
│ Presentation Layer             │
├────────────────────────────────┤
│ React 19                        │
│ React Router v5                 │
│ Lucide Icons                    │
│ HTML5 / CSS3                    │
└────────┬───────────────────────┘
         │ HTTPS / JSON
         │
┌────────▼───────────────────────┐
│ API Layer                       │
├────────────────────────────────┤
│ Express.js                      │
│ CORS Middleware                 │
│ JWT Authentication              │
│ bcryptjs (Password Hashing)     │
│ validator.js (Input Validation) │
└────────┬───────────────────────┘
         │ SQL / MySQL Protocol
         │
┌────────▼───────────────────────┐
│ Data Layer                      │
├────────────────────────────────┤
│ MySQL 5.7+                      │
│ Connection Pooling              │
│ Indexed Queries                 │
│ Foreign Key Constraints         │
└────────────────────────────────┘
```

## Request/Response Cycle

```
1. User Action (Frontend)
        ↓
2. Create HTTP Request
   - Method: GET/POST/PUT/DELETE
   - URL: /api/endpoint
   - Headers: {Authorization: Bearer token, Content-Type: application/json}
   - Body: {JSON data}
        ↓
3. Vercel Routes Request
   - /api/* → Backend function
   - /* → Frontend files
        ↓
4. Backend Processing
   - Receive request
   - Parse JSON body
   - Extract JWT token
   - Verify authentication
   - Validate input
   - Execute business logic
   - Query database
        ↓
5. Database Operation
   - Parse SQL query
   - Execute with connection pool
   - Return results
        ↓
6. Backend Response
   - Format response
   - Set HTTP status
   - Return JSON
        ↓
7. Frontend Processing
   - Parse JSON response
   - Update state
   - Re-render UI
        ↓
8. Display to User
   - Show data
   - Show errors
   - Show loading state
```

## Deployment Architecture

```
GitHub Repository
        │
        ▼
    Vercel
        │
    ┌───┴────┐
    │        │
    ▼        ▼
  Build    Build
  Backend  Frontend
    │        │
    └───┬────┘
        │
        ▼
   Serverless Functions (Backend)
   Static Assets (Frontend)
        │
        ├─ Node.js Runtime
        ├─ Environment Variables
        └─ Database Access
```

## Performance Optimization

```
Frontend
├─ Code splitting (React Router)
├─ Lazy loading images
├─ Caching with localStorage
└─ Efficient state management

Backend
├─ Connection pooling
├─ Query optimization (indexes)
├─ Caching (could be added)
├─ Response compression
└─ Efficient error handling

Database
├─ Indexed queries on frequently searched fields
├─ Foreign key constraints for data integrity
├─ Connection pooling for concurrent requests
└─ Query optimization
```

## Security Layers

```
Client Layer
├─ Input validation
├─ Secure token storage
└─ HTTPS only

API Layer
├─ JWT token verification
├─ Input sanitization
├─ Rate limiting (optional)
├─ CORS headers
└─ Secure headers (should add)

Database Layer
├─ Parameterized queries
├─ Access control
├─ Encryption (optional)
└─ Regular backups
```

## Scalability Considerations

**Current Architecture**: Suitable for up to 10,000 daily active users

**To Scale Further**:
- Add caching layer (Redis)
- Implement database replication
- Add CDN for static assets
- Implement job queue (Bull, RQ)
- Add monitoring and logging
- Implement rate limiting
- Add API versioning

---

**For detailed deployment instructions**, see `VERCEL_DEPLOY_STEPS.md`

**For setup instructions**, see `SETUP_GUIDE.md`
