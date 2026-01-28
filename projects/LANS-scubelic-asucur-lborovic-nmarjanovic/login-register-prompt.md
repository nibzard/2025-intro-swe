I have a GitHub project at:
https://github.com/Stipe15/2025-intro-swe/tree/main/projects/LANS-scubelic-asucur-lborovic-nmarjanovic

I want you to generate *complete working code* and instructions to implement the following features:

---

## Project Context
- It currently does not have a login or registration system.
- I want users to be able to **create accounts (register)** and then **log in**.
- After logging in, users should be able to **save their own API keys** to their account.
- The API keys must be stored securely (not in plaintext files in the repo). You can use database encryption or standard secure best practices.
- Provide *secure authentication* (hashed passwords, session/cookie or JWT).
- Provide backend routes + frontend pages.

---

## Requirements

### 1) Tech Stack
1. Detect the current backend stack (Express/Node, Python/Flask/Django, or other).
   - If multiple options are possible, choose the stack that fits best with the existing project structure.

### 2) Database
2. Set up a database for user accounts (e.g., SQLite, PostgreSQL, or MongoDB).
   - Create a **User** model with fields:
     - id (primary key)
     - username (string, unique)
     - email (string, unique)
     - password_hash (string)
     - apiKey (string, encrypted or hashed)
   - Use environment config for database credentials.

### 3) Authentication Pages
3. Create **Register Page**:
   - URL: `/register`
   - Form fields: username, email, password, confirm password
   - Save user with hashed password
   - If email/username exists, show error

4. Create **Login Page**:
   - URL: `/login`
   - Form fields: email (or username), password
   - Check hashed password and authenticate user

5. Create **Logout Route**
   - URL: `/logout`
   - Ends session or invalidates JWT

### 4) User Session / Auth
6. Implement authentication:
   - Either **session cookies** or **JWT token**.
   - Provide middleware/routes to protect authenticated routes.

### 5) API Key Storage
7. After logging in, user should have a **dashboard page**:
   - URL: `/profile` or `/dashboard`
   - Show current saved API key (masked)
   - Form to **add or update API key**
   - Save API key securely in database
     - Prefer encrypted storage or hashing (but retrievable if needed)
     - Explain how encryption works and how to store secrets (env vars)

### 6) Backend API Routes
8. Provide backend endpoints:
   - `POST /api/register`
   - `POST /api/login`
   - `GET /api/me` (return profile + masked api key)
   - `PUT /api/me/api-key` (save new API key)
   - `POST /api/logout`

### 7) Frontend Implementation
9. Provide complete HTML/CSS/JS pages or templates (for your chosen framework) for:
   - `/register`
   - `/login`
   - `/dashboard`
   - Include client-side validation

### 8) Security Best Practices
10. Follow secure practices:
    - Hash passwords with bcrypt (or equivalent)
    - Protect routes that require auth
    - Store API keys securely (masked in UI)
    - Provide instructions on environment variable configuration (e.g., database URL, encryption keys)

### 9) Deployment Notes
11. Provide steps to:
    - Set up database migrations
    - Run the server locally
    - Add environment variables

### 10) Testing
12. Provide basic test cases for:
    - Registering users
    - Logging in with correct and incorrect credentials
    - Updating and retrieving API keys

---

## Output Expectations

- Generate *runnable code* for the backend and frontend (no placeholders).
- Include comments in the code explaining key functionality.
- Provide a **clear README update** section describing how to use the new functionality.
- If the current project already uses a specific framework, integrate the auth code into that framework.

---

## Optional (Bonus)
- Add “Login with GitHub” OAuth using GitHub as an identity provider.
- Use JWT refresh token rotation
- Allow users to delete their account

---

Remember: produce complete files where possible, not just snippets; include instructions to install dependencies and run the app.

