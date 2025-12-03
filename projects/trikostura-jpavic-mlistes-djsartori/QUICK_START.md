# 🚀 Quick Start Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Setup Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and create
4. Wait 2-3 minutes for setup

## Step 3: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string)

## Step 4: Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=paste-your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
```

## Step 5: Setup Database

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Open `supabase/schema.sql` in this project
3. Copy ALL the content (Ctrl+A, Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **RUN** (or F5)
6. Wait for "Success. No rows returned" message

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7: Test the Forum

1. Click **Registracija** (Register)
2. Create account with:
   - Email
   - Username
   - Full name
   - Password
3. After registration, you'll be redirected to `/forum`
4. Click **Nova tema** to create first topic
5. Test creating topics and replies!

## 🎉 You're Done!

Your forum is now running locally.

## Making Your First User an Admin

1. Go to Supabase dashboard
2. Click **Table Editor** > **profiles**
3. Find your user
4. Click the `role` cell
5. Change from `student` to `admin`
6. Save

Now you're an admin! (Admin features coming soon)

## Troubleshooting

**Problem:** Can't connect to Supabase
- Check `.env.local` has correct credentials
- Restart dev server after changing `.env.local`

**Problem:** Database tables don't exist
- Make sure you ran the entire `schema.sql` in Supabase SQL Editor

**Problem:** Build errors
- Run `npm install` again
- Delete `.next` folder and rebuild
- Check Node.js version is 18+

## What's Working

✅ User registration & login
✅ Create topics
✅ Reply to topics
✅ Upvote/downvote replies
✅ Browse categories
✅ View topic details

## What's Not Implemented Yet

⏳ Search functionality
⏳ User profile pages
⏳ Admin panel
⏳ Edit profile
⏳ Notifications

See `PROJECT_STATUS.md` for full feature list.

## Next Steps

Want to continue development? Check:
- `PROJECT_STATUS.md` - Full status and roadmap
- `SETUP.md` - Detailed technical setup
- `README.md` - Project overview
