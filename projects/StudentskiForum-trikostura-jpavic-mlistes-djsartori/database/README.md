# Database Setup

## Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Execute the SQL script

This will create:
- **profiles** table - Extended user profiles with roles (student/admin)
- **categories** table - Forum categories
- **topics** table - Forum topics/threads
- **responses** table - Replies to topics
- Row Level Security (RLS) policies for secure data access
- Triggers for automatic timestamp updates
- Default categories

## Environment Variables

After creating your project, update `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in:
Settings > API > Project URL and anon public key

## Creating an Admin User

By default, all new users are created as 'student' role. To create an admin:

1. Create a user through the signup flow
2. Go to Supabase Dashboard > Authentication > Users
3. Copy the user's UUID
4. Go to Table Editor > profiles
5. Find the user and change their `role` from 'student' to 'admin'
