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

### Important: Password Reset Configuration

For password reset to work correctly, you need to configure Supabase Auth settings:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Email Templates**
3. Select "Change Email Address" template
4. Make sure **"Secure email change enabled (Recommended)"** is **DISABLED** for password reset

**Why?** Password reset uses a recovery flow that sends tokens in the URL hash fragment (e.g., `#access_token=...&refresh_token=...&type=recovery`). If "Secure email change" is enabled, Supabase will use PKCE flow which sends a code instead, but this doesn't work for server-initiated password reset flows because there's no way to store the `code_verifier`.

Alternatively, you can:
- Go to **Authentication > URL Configuration**
- Set the correct redirect URLs for your environment
- For local development: `http://localhost:3000/auth/callback`
- For production: `https://your-domain.com/auth/callback`

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
