# Student Forum

**Authors:** Jan Pavić | Damjan Josip Sartori | Marino Listeš

Online forum for students from all universities in Croatia. Users can create and respond to threads, vote on answers, and participate in discussions by categories.

## 🚀 Features

### Implemented ✅
- ✅ **Authentication** - User registration and login with Supabase Auth
- ✅ **Forum categories** - 6 predefined categories (General, Questions, Study, Career, Technology, Off-topic)
- ✅ **Topics** - Create, view and list topics with pagination
- ✅ **Replies** - Comment on topics with real-time updates
- ✅ **Voting** - Upvote/downvote system for replies
- ✅ **Search** - Full-text search through topics by title and content
- ✅ **User profiles** - Complete profiles with statistics and activities
- ✅ **Profile editing** - Edit avatar, biography and other data
- ✅ **Admin panel** - Complete admin panel for managing users, topics, replies, categories and analytics
- ✅ **Notifications** - Real-time notifications for new replies, upvotes and pinned topics
- ✅ **Markdown support** - Rich text editor with live preview and syntax highlighting
- ✅ **Responsive design** - Optimized for mobile devices
- ✅ **Dark mode support** - Light and dark theme
- ✅ **Loading states** - Skeleton screens for better UX
- ✅ **Performance optimizations** - ISR caching, image optimization

## 🛠 Tech Stack

- **Frontend:** Next.js 16.0.7 (App Router), TypeScript, React 19.2.1
- **Styling:** Tailwind CSS 3.4.18, shadcn/ui components
- **Markdown:** react-markdown, remark-gfm, rehype-sanitize, react-syntax-highlighter
- **Validation:** Zod 4.1.13
- **Backend:** Supabase (PostgreSQL) with Row-Level Security
- **Authentication:** Supabase Auth with SSR (@supabase/ssr)
- **Deployment:** Vercel (recommended)

### 🎯 Performance Features
- ✅ Incremental Static Regeneration (ISR)
- ✅ Image optimization (AVIF/WebP)
- ✅ Package tree-shaking (lucide-react, supabase)
- ✅ gzip compression
- ✅ Font preloading
- ✅ 0 security vulnerabilities

## 📦 Installation

### 1. Prerequisites
- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings > API** and copy:
   - Project URL
   - anon/public key

### 4. Environment variables

```bash
cp .env.example .env.local
```

Add your data to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Set up database

1. Go to Supabase dashboard > **SQL Editor**
2. Copy the entire content from `supabase/schema.sql`
3. Paste into SQL Editor and run
4. Copy the entire content from `supabase/notifications.sql`
5. Paste into SQL Editor and run

This will create all tables, policies, triggers, functions and default categories.

**⚠️ Important:**
- Go to **Authentication > Providers > Email** and **disable** "Confirm email" if you want to test registration without email confirmation.
- Notifications SQL must be run after schema.sql because it depends on tables from schema.sql
- **For password reset:** "Secure email change enabled" MUST be disabled in Supabase. See [SETUP.md](SETUP.md) for details.

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 👤 Creating Admin User

After registration:

1. Go to Supabase Dashboard > **Table Editor** > `profiles`
2. Find your user
3. Change `role` from `student` to `admin`

## 📁 Project Structure

```
/app
  /auth              # Login, register pages
  /forum             # Forum pages
    /category/[slug] # Categories
    /topic/[slug]    # Individual topic
    /user/[username] # User profiles
      /edit          # Profile editing
    /search          # Topic search
    /new             # New topic
    loading.tsx      # Loading states
  /admin             # Admin panel
    /users           # User management
    /topics          # Topic moderation
    /replies         # Reply moderation
    /categories      # Category management
    /analytics       # Analytics and statistics
  /notifications     # Page with all notifications
/components
  /ui                # shadcn components
  /forum             # Forum components (markdown editor/renderer, forms, cards)
  /notifications     # Notification components (bell, list)
  /layout            # Navbar
/lib
  /supabase          # Supabase client (SSR & client)
  /validations       # Zod schemas
/types               # TypeScript types
/supabase
  schema.sql         # Database schema
  notifications.sql  # Notification system schema
```

## 🚀 Deployment to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy!

## 📊 Features

### Authentication
- User registration and login
- Email confirmation (optional)
- Server-side rendering (SSR) for security

### Forum Functionality
- **Categories**: 6 predefined categories with colors
- **Topics**: Create new topics, pinning, view count
- **Replies**: Comment with threaded replies
- **Voting**: Upvote/downvote system
- **Search**: Full-text search by title and content
- **Markdown**: Rich text editor with live preview, syntax highlighting and help

### Notifications
- Real-time notifications (polling every 30 seconds)
- Notifications for new replies to topics
- Notifications for replies to comments
- Notifications for upvotes
- Notifications for pinned topics
- Bell icon in navbar with unread count
- Mark as read / Delete notification

### User Profile
- User statistics (topics, replies, reputation)
- Latest topics and replies
- Role badges (Admin, Moderator)
- Join date
- Profile editing (avatar, biography, faculty, major)

### Admin Panel
- User management (ban, promote, role assignment)
- Topic moderation (pin, lock, delete)
- Reply moderation (delete)
- Category management (CRUD)
- Platform analytics and statistics

### UI/UX
- Skeleton loading states
- Responsive design (mobile-first)
- Dark mode support
- Optimized images (AVIF/WebP)

## 📄 Status

**✅ Production Ready** - All core features implemented and optimized

### 🆕 Latest Updates (V2.5.1 - December 13, 2025)

**New Features:**
- ✨ **Gamification system** - Achievements, leaderboards (all-time and weekly), activity tracking
- ✨ **Content moderation** - Spam detection, rate limiting, content filtering (Croatian)
- ✨ **Polls and reactions** - Poll creation and reaction system for posts
- ✨ **Vercel Analytics** - Performance tracking and unique views per user
- ✨ **Improved registration** - Real-time email check, character counter, persisted form data
- ✨ **Email verification** - Mandatory verification before forum access
- ✨ **Terms and privacy** - Terms of service and privacy policy pages
- ✨ **Breadcrumb navigation** - Navigation paths across all forum pages
- ✨ **Private messaging** - Private message and user follow system
- ✨ **Bookmarks** - Save favorite topics
- ✨ **Password reset** - Complete custom email-based password reset system

**Optimizations:**
- ⚡ Massive performance optimization - 60-85% faster page loads
- ⚡ Parallel database queries - 3-5x faster query execution
- ⚡ Dark mode with dropdown theme switcher
- ⚡ Responsive animations and visual feedback

**Bug Fixes:**
- 🐛 TypeScript errors throughout the application
- 🐛 RLS policies for server-side operations
- 🐛 Middleware deprecation (Next.js 16)
- 🐛 Supabase client initialization
- 🐛 Email template rendering and compatibility

---

**Note:** For detailed setup instructions, please refer to the "📦 Installation" section above.
