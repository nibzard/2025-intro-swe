# Budgetly - Deployment Guide

This guide explains how to set up and run the Budgetly personal finance tracking application locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | >= 18.0.0 | JavaScript runtime |
| **npm** | >= 9.0.0 | Package manager (comes with Node.js) |
| **MongoDB** | >= 6.0 | Database |

### Check Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MongoDB version
mongod --version
```

---

## Environment Setup

### 1. Clone the Repository

```bash
cd /path/to/your/projects
git clone <repository-url>
cd JNIP-jananovakovic-ivapuljic/budgetly
```

### 2. Project Structure Overview

```
budgetly/
├── backend/          # Express.js API server
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
└── frontend/expense-tracker/  # React application
    ├── public/
    ├── src/
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `multer` - File uploads
- `xlsx` - Excel export

### Step 3: Start MongoDB

**Option A: Run MongoDB locally (default)**

```bash
# Start MongoDB service
mongod

# Or start as a background service (macOS/Linux)
brew services start mongodb-community
```

**Option B: Use MongoDB Atlas (cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Use it in the `.env` file (see Step 4)

### Step 4: Create Environment File

Create a `.env` file in the `backend` directory:

```bash
touch .env
```

Add the following content:

```env
# MongoDB Connection URI
# Local MongoDB:
MONGO_URI=mongodb://localhost:27017/budgetly

# MongoDB Atlas (cloud):
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/budgetly

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this

# Frontend URL
CLIENT_URL=http://localhost:5173

# Backend Port
PORT=5000
```

### Step 5: Verify Database Connection (Optional)

You can test your MongoDB connection:

```bash
# Connect to MongoDB shell
mongosh

# Or legacy shell
mongo

# In the shell, verify you can connect
use budgetly
db.test.insertOne({test: "connection"})
db.test.find()
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd ../frontend/expense-tracker
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `react` - UI library
- `react-dom` - React DOM bindings
- `react-router-dom` - Routing
- `axios` - HTTP client
- `recharts` - Data visualization
- `tailwindcss` - Styling
- `moment` - Date handling
- `react-hot-toast` - Notifications
- `react-icons` - Icon library

### Step 3: Verify API Endpoint

By default, the frontend connects to `http://localhost:5000` for the API.

If you changed the backend port, update the API base URL in:
- `frontend/expense-tracker/src/utils/axios.js` (if exists)
- Or check `src/api/` folder for API configuration

---

## Running the Application

You need to run both the backend and frontend servers simultaneously.

### Option 1: Run in Separate Terminal Windows

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# or just
npm start
```

Expected output:
```
Server is running on port 5000
MongoDB Connected Successfully
```

**Terminal 2 - Frontend:**

```bash
cd frontend/expense-tracker
npm run dev
```

Expected output:
```
  VITE v6.0.5  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Option 2: Run with a Single Command (Recommended)

You can use a single terminal to run both servers with concurrency tools:

```bash
# Install concurrently if not already installed
npm install -g concurrently

# From the budgetly root directory
concurrently "cd backend && npm run dev" "cd frontend/expense-tracker && npm run dev"
```

---

## Accessing the Application

1. Open your browser
2. Navigate to: **http://localhost:5173**
3. You will be redirected to the login page

### Default Routes

| Path | Page | Protected |
|------|------|-----------|
| `/` | Redirects to dashboard | Yes |
| `/login` | Login page | No |
| `/signUp` | Registration page | No |
| `/dashboard` | Main dashboard | Yes |
| `/income` | Income management | Yes |
| `/expense` | Expense management | Yes |

### First-Time Use

1. Click "Don't have an account? Sign Up"
2. Fill in the registration form:
   - Name
   - Email
   - Password
3. After registration, you'll be redirected to the dashboard
4. Start adding income and expense entries!

---

## Troubleshooting

### Issue: MongoDB Connection Failed

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
1. Make sure MongoDB is running:
   ```bash
   mongod
   ```
2. Check if MongoDB is on the correct port (default: 27017)
3. Verify your `MONGO_URI` in `.env`

---

### Issue: Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**

**Find and kill the process using the port:**

```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Or
npx kill-port 5000
```

---

### Issue: CORS Errors

**Error:** `Access to XMLHttpRequest at 'http://localhost:5000' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution:**

Check that `CLIENT_URL` in your backend `.env` matches your frontend URL:

```env
CLIENT_URL=http://localhost:5173
```

---

### Issue: JWT Token Errors

**Error:** `jwt malformed` or `invalid token`

**Solution:**

1. Clear your browser localStorage:
   ```javascript
   // In browser console
   localStorage.clear()
   ```
2. Log in again to get a fresh token

---

### Issue: Frontend Build Errors

**Error:** Module not found or Vite errors

**Solution:**

```bash
# Clear node_modules and reinstall
cd frontend/expense-tracker
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: Backend Module Errors

**Error:** Cannot find module or dependency errors

**Solution:**

```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## Development Tips

### Hot Reload

Both frontend and backend support hot reload during development:
- **Frontend:** Changes auto-refresh in browser (Vite)
- **Backend:** Server restarts automatically (nodemon)

### Viewing Logs

- **Backend logs:** Check the terminal where `npm run dev` is running
- **Frontend logs:** Open browser DevTools (F12) → Console tab

### Database Inspection

Use MongoDB Compass or mongosh to inspect data:

```bash
# Connect with mongosh
mongosh
use budgetly

# View all users
db.users.find()

# View all income
db.incomes.find()

# View all expenses
db.expenses.find()
```

---

## Production Deployment

For production deployment, consider:

| Platform | Backend | Frontend |
|----------|---------|----------|
| **Railway** | Deploy Express | Deploy Vite build |
| **Render** | Deploy Express | Deploy Vite build |
| **Heroku** | Deploy Express | Deploy Vite build on Vercel |
| **Vercel** | N/A | Deploy Vite build |
| **DigitalOcean** | Deploy droplet | Deploy Vite build |

### Building for Production

**Frontend:**
```bash
cd frontend/expense-tracker
npm run build
# Output in: dist/
```

**Backend:**
- Set `NODE_ENV=production` in environment
- Use a process manager like PM2:
  ```bash
  npm install -g pm2
  pm2 start server.js --name budgetly-api
  ```

---

## Summary

1. Install Node.js, npm, and MongoDB
2. Set up backend with `.env` file
3. Install backend dependencies
4. Set up frontend and install dependencies
5. Start MongoDB
6. Run backend server (port 5000)
7. Run frontend server (port 5173)
8. Open http://localhost:5173 in your browser

Happy budgeting! 🚀
