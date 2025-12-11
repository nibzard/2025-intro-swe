# Setup Instructions

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to Settings > API
3. Copy your project URL and anon key

## 2. Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## 3. Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL Editor and run it
5. This will create all tables, policies, functions, and default categories

## 4. Authentication Configuration

### Password Reset Configuration

**IMPORTANT:** Password reset requires implicit flow (hash-based tokens). PKCE does not work for server-initiated password reset.

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Providers > Email**
3. **DISABLE** "Secure email change enabled (Recommended)"
4. Click **Save**

**Why?** Password reset is initiated via email (server-side), which means there's no client-side `code_verifier` for PKCE. The implicit flow sends tokens in the URL hash fragment which works correctly for password reset.

**Note:** You can keep PKCE enabled for regular login/signup - only password reset needs the implicit flow.

### URL Configuration

Set the correct redirect URLs:
- Go to **Authentication > URL Configuration**
- For local development: `http://localhost:3000/auth/callback`
- For production: `https://2025-intro-swe-bice.vercel.app/auth/callback`

### Optional: Disable Email Confirmation (for testing)

- Go to **Authentication > Providers > Email**
- **Disable** "Confirm email" if you want to test registration without email confirmation

## 5. Install Dependencies and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your forum!

## 6. Create Admin User (Optional)

After registering your first user, you can make them an admin:

1. Go to Supabase Dashboard > Table Editor > profiles
2. Find your user and change the `role` field from `student` to `admin`

## Features Included

- ✅ User authentication (register/login)
- ✅ Forum categories
- ✅ Create and view topics
- ✅ Reply to topics
- ✅ Upvote/downvote system
- ✅ User profiles
- ✅ Search functionality
- ✅ Admin panel
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Dark mode support

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel (recommended)
