# Troubleshooting Image Upload Issues

## Problem: Images Don't Change After Upload

If images aren't updating after upload, follow these diagnostic steps:

### Step 1: Verify Database Migration Has Been Run

The most common issue is that the database columns don't exist yet.

**Check if columns exist:**
```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('avatar_url', 'profile_banner_url', 'profile_color', 'github_url', 'linkedin_url', 'website_url', 'twitter_url', 'year_of_study', 'graduation_year', 'academic_interests', 'skills');
```

**If columns are missing, run the migration:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/advanced-profile-fields.sql`
3. Execute the SQL

### Step 2: Verify Supabase Storage Bucket Exists

**Check Storage Setup:**
1. Go to Supabase Dashboard → Storage
2. Verify bucket named `profile-images` exists
3. Check that it's set to **Public**
4. Verify folders exist: `avatars/` and `banners/`

**Create if missing:**
1. Click "New bucket"
2. Name: `profile-images`
3. Public bucket: **Yes**
4. Create folders by uploading a test file to `avatars/test.txt` and `banners/test.txt`, then delete them

### Step 3: Check Browser Console for Errors

Open browser DevTools (F12) and check for:
- Network errors (failed uploads)
- JavaScript errors
- CORS errors
- 401/403 authentication errors

Common errors:
```
"The resource you are looking for could not be found"
→ Storage bucket doesn't exist

"new row violates row-level security policy"
→ RLS policies are too restrictive

"column 'avatar_url' does not exist"
→ Database migration not run
```

### Step 4: Check Server Logs

Look at the terminal where `npm run dev` is running:

**Good signs:**
```
POST /forum/user/username/edit 200
Profile updated successfully
```

**Bad signs:**
```
Error: relation "public.profiles" does not have column "avatar_url"
Error: The resource you are looking for could not be found
```

### Step 5: Test Upload Flow Manually

1. Go to `/forum/user/[username]/edit`
2. Open browser DevTools → Network tab
3. Select an image
4. Click "Učitaj" (Upload)
5. Watch for:
   - POST request to uploadProfileImage action
   - Response with `{success: true, url: "..."}`
   - Immediate profile update
   - Page refresh/revalidation

### Step 6: Verify RLS Policies

If uploads fail with 403 errors:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- Check policies
SELECT * FROM pg_policies
WHERE tablename = 'profiles';
```

The profiles table should have:
- SELECT policy allowing everyone to view profiles
- UPDATE policy allowing users to update their own profile

### Step 7: Check Image URL Format

After upload, URLs should look like:
```
https://[project-id].supabase.co/storage/v1/object/public/profile-images/avatars/[user-id]-[timestamp].jpg
```

If URL format is wrong:
- Bucket might not be public
- Storage API URL might be incorrect

### Step 8: Clear Browser Cache

Sometimes stale data is cached:
1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. Clear site data: DevTools → Application → Clear storage
3. Try incognito/private window

## How Image Upload Should Work (New Flow)

After the fix, the upload process is:

1. **User selects image** → Preview shows immediately
2. **User clicks "Učitaj"** →
   - Image uploads to Supabase Storage
   - URL is returned
   - **Database is immediately updated** (NEW!)
   - Cache is revalidated
   - Upload button shows success
3. **User sees change immediately** → No need to click "Spremi Promjene"

The profile form save now only updates text fields, not images. Images are saved immediately upon upload.

## Common Issues and Solutions

### Issue: "Slika je učitana ali nije spremljena u profil"

**Cause:** Database column doesn't exist or RLS prevents update

**Solution:**
1. Run database migration
2. Check RLS policies allow self-update
3. Verify user is authenticated

### Issue: Images upload but don't show

**Cause:** Cache not invalidated or image URL not saved

**Solution:**
- Check server logs for update errors
- Hard refresh browser (Ctrl+Shift+R)
- Check database: `SELECT avatar_url, profile_banner_url FROM profiles WHERE id = '[user-id]'`

### Issue: Upload button doesn't respond

**Cause:** JavaScript error or storage configuration

**Solution:**
1. Check browser console for errors
2. Verify `profile-images` bucket exists
3. Check network tab for failed requests

### Issue: CORS error

**Cause:** Storage bucket configuration

**Solution:**
- Ensure bucket is public in Supabase settings
- Check storage URL in environment variables

## Testing Checklist

- [ ] Database migration run successfully
- [ ] `profile-images` bucket exists and is public
- [ ] `avatars/` and `banners/` folders exist (or will be created on first upload)
- [ ] Can upload avatar - image shows immediately
- [ ] Can upload banner - image shows immediately
- [ ] Images persist after page refresh
- [ ] Images show on public profile page
- [ ] Can change profile color - color applies immediately
- [ ] Other profile fields save correctly
- [ ] No console errors
- [ ] No server errors in terminal

## Still Not Working?

If you've tried everything:

1. **Check exact error message** in browser console or server logs
2. **Verify environment variables** in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Test Supabase connection**:
   - Try logging in/out
   - Check other profile updates work
4. **Check Supabase project status** in dashboard
5. **Review RLS policies** for profiles table and storage

## Debug Command

Run this to check database schema:
```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

Expected to see all new columns including:
- avatar_url (text, nullable)
- profile_banner_url (text, nullable)
- profile_color (text, default '#3B82F6')
- github_url, linkedin_url, website_url, twitter_url (text, nullable)
- year_of_study, graduation_year (integer, nullable)
- academic_interests, skills (text, nullable)
