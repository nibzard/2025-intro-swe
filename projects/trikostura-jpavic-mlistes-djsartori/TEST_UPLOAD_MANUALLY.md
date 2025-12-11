# Manual Upload Test Steps

Follow these steps to diagnose the image upload issue:

## Step 1: Open Browser Developer Tools
1. Press **F12** (or right-click → Inspect)
2. Go to the **Console** tab
3. Keep it open during all steps below

## Step 2: Navigate to Edit Profile
1. Go to `/forum/user/[your-username]/edit`
2. Check console for any errors (red text)

## Step 3: Try to Upload Avatar
1. Click "Odaberi Sliku" under Avatar section
2. Select an image file
3. **IMPORTANT:** Click the "Učitaj" (Upload) button that appears
4. Watch the console for:
   - Any error messages
   - Network requests

## Step 4: Check Network Tab
1. Go to **Network** tab in DevTools
2. Try uploading again
3. Look for a POST request to `uploadProfileImage` or similar
4. Click on it and check:
   - **Status code** (should be 200)
   - **Response** tab - look for error messages
   - **Preview** tab - should show `{success: true, url: "..."}`

## Expected Behavior vs Actual

### EXPECTED:
- Select image → Preview shows
- Click "Učitaj" → Button shows "Učitavanje..."
- Upload completes → Image appears in preview
- URL is saved to database automatically
- Image visible immediately

### IF NOT WORKING, CHECK:

#### Console Errors to Look For:
```
❌ "Cannot read properties of undefined"
   → JavaScript error, component issue

❌ "Network error" / "Failed to fetch"
   → Server/Supabase connection issue

❌ "The resource you are looking for could not be found"
   → Storage bucket issue

❌ "new row violates row-level security policy"
   → Database permissions issue
```

#### Network Request Issues:
- **No POST request appears** → Upload function not being called
- **Status 500** → Server error (check terminal logs)
- **Status 404** → Storage bucket not found
- **Status 401/403** → Authentication/permission issue

## Step 5: Check Server Logs
Look at your terminal where `npm run dev` is running.

After clicking upload, you should see:
```
POST /forum/user/[username]/edit 200
```

If you see errors like:
- `"column does not exist"` → Migration not run
- `"bucket not found"` → Storage not configured
- `"permission denied"` → RLS policy issue

## Step 6: Verify Storage Bucket Settings

In Supabase Dashboard → Storage → profile-images:

### Required Settings:
- [x] Bucket exists
- [x] **Public bucket:** ON (this is critical!)
- [x] No restrictive policies (or allow authenticated uploads)

### Check Bucket Policies:
Go to Storage → profile-images → Policies

You should have:
- "Allow public read access" OR no policies at all (for public bucket)
- "Allow authenticated uploads" OR similar

If policies are too restrictive, images won't upload.

## Step 7: Test Direct Upload

Open browser console and paste this:

```javascript
// Test if we can reach Supabase Storage
fetch('https://fshdebfiyokhhrgqvnpz.supabase.co/storage/v1/bucket/profile-images', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaGRlYmZpeW9raGhyZ3F2bnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzYwODgsImV4cCI6MjA4MDM1MjA4OH0.XK2fHsKssIg6Q_1Iyx3Wowj4CbMsRGZsGtNC2VSMwGc'
  }
}).then(r => r.json()).then(console.log)
```

Expected result: Bucket info or error message

## Quick Fix Attempts

### Fix 1: Make Sure Bucket is Public
```sql
-- Run in Supabase SQL Editor
UPDATE storage.buckets
SET public = true
WHERE name = 'profile-images';
```

### Fix 2: Add Upload Policy
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');
```

### Fix 3: Clear Browser Cache
- Hard refresh: **Ctrl + Shift + R** (Windows/Linux) or **Cmd + Shift + R** (Mac)
- Or open in **Incognito/Private** window

## Common Issues

### Issue: "Učitaj" button doesn't appear
**Cause:** File input not working
**Fix:** Check console for errors, try different browser

### Issue: Button appears but nothing happens on click
**Cause:** JavaScript error or upload function not called
**Fix:** Check console for errors, verify upload action exists

### Issue: Upload seems to work but image doesn't show
**Cause:** Database not updating or cache issue
**Fix:**
1. Check database: Select avatar_url from profiles where username = 'yourusername'
2. Hard refresh browser
3. Check if URL is valid by pasting in new tab

### Issue: "Datoteka mora biti slika" error
**Cause:** File type validation
**Fix:** Make sure you're selecting PNG, JPG, or GIF files

## Report Back

After testing, please report:
1. **Console errors** (screenshot or copy text)
2. **Network tab** - status code and response
3. **Server logs** - any errors during upload
4. **Which step failed** - where did it stop working?

This will help diagnose the exact issue!
