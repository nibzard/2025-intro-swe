# Advanced User Profile Customization - Setup Guide

This document explains the advanced profile customization features that have been implemented and the steps needed to complete the setup.

## ✨ Features Implemented

### 1. Avatar/Profile Picture Upload
- Upload custom profile pictures with preview
- Image validation (type, size)
- Support for PNG, JPG, GIF formats
- Maximum 5MB file size
- Recommended size: 400x400px

### 2. Profile Banner Upload
- Upload custom banner images
- Maximum 10MB file size
- Recommended size: 1200x400px
- Falls back to gradient based on profile color

### 3. Social Media & Portfolio Links
- GitHub profile link
- LinkedIn profile link
- Personal website/portfolio
- Twitter/X profile link
- Clickable icons on profile page

### 4. Extended Academic Information
- Year of study (1-10)
- Graduation year
- Academic interests (500 char max)
- Skills and technologies (comma-separated)

### 5. Profile Theme Customization
- Custom profile color picker
- Hex color input (#RRGGBB format)
- Color applied to:
  - Profile avatar background
  - Profile banner gradient
  - Statistics numbers
  - Skill tags
  - Default banner gradient

## 📁 Files Created/Modified

### Created Files
- `supabase/advanced-profile-fields.sql` - Database migration
- `components/profile/avatar-upload.tsx` - Avatar upload component
- `components/profile/banner-upload.tsx` - Banner upload component
- `lib/upload.ts` - Upload utilities (currently unused in favor of server actions)
- `PROFILE_CUSTOMIZATION_SETUP.md` - This file

### Modified Files
- `types/database.ts` - Added new profile fields to TypeScript types
- `lib/validations/profile.ts` - Updated validation schema
- `app/forum/user/[username]/edit/profile-edit-form.tsx` - Complete redesign with all new fields
- `app/forum/user/[username]/edit/actions.ts` - Added new fields handling and image upload
- `app/forum/user/[username]/page.tsx` - Enhanced profile display with new information

## 🔧 Setup Steps

### 1. Run Database Migration

You need to run the SQL migration to add the new fields to your database:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/advanced-profile-fields.sql`
4. Paste and run the SQL

**Option B: Using Supabase CLI** (if installed)
```bash
supabase db push
```

### 2. Set Up Supabase Storage

Create a storage bucket for profile images:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `profile-images`
3. Set it to **Public** (or configure appropriate RLS policies)
4. Create two folders inside the bucket:
   - `avatars/`
   - `banners/`

### 3. Configure Storage Policies (Optional)

If you want more control over who can upload/delete images, add RLS policies in Supabase:

```sql
-- Allow authenticated users to upload their own images
create policy "Users can upload own profile images"
on storage.objects for insert
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own images
create policy "Users can update own profile images"
on storage.objects for update
using (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
create policy "Users can delete own profile images"
on storage.objects for delete
using (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Test the Features

1. Navigate to your profile: `/forum/user/[your-username]`
2. Click "Uredi Profil" (Edit Profile)
3. Test each section:
   - Upload a profile picture
   - Upload a banner image
   - Change your profile color
   - Add academic information
   - Add social media links
   - Add skills and interests

## 📊 Database Schema Changes

The following fields were added to the `profiles` table:

### Social Media Links
- `github_url` (text, nullable)
- `linkedin_url` (text, nullable)
- `website_url` (text, nullable)
- `twitter_url` (text, nullable)

### Academic Information
- `year_of_study` (integer, 1-10, nullable)
- `graduation_year` (integer, 1900-2100, nullable)
- `academic_interests` (text, 500 chars max, nullable)
- `skills` (text, 1000 chars max, nullable, comma-separated)

### Profile Customization
- `profile_color` (text, hex format, default: '#3B82F6')
- `profile_banner_url` (text, nullable)

Note: `avatar_url` already existed in the schema.

## 🎨 UI/UX Features

### Profile Edit Page
- Organized into sections with headings
- Avatar upload with live preview
- Banner upload with live preview
- Color picker with hex input
- Comprehensive form validation
- Loading states during upload
- Error handling and user feedback

### Profile Display Page
- Banner image or gradient background
- Avatar with fallback to colored initial
- Social media icon links
- Academic information grid
- Skills displayed as colored tags
- Profile color theme throughout
- Edit button (only for own profile)

## 🔍 Validation Rules

- **Full Name**: 2-100 characters (required)
- **Bio**: Max 500 characters
- **University**: Max 100 characters
- **Study Program**: Max 100 characters
- **URLs**: Must be valid URL format
- **Year of Study**: Integer 1-10
- **Graduation Year**: Integer 1900-2100
- **Academic Interests**: Max 500 characters
- **Skills**: Max 1000 characters
- **Profile Color**: Must be hex format (#RRGGBB)
- **Avatar**: Max 5MB, image files only
- **Banner**: Max 10MB, image files only

## 🚀 Next Steps / Future Enhancements

Consider adding:
- Image cropping/resizing before upload
- More social media platforms (Instagram, TikTok, etc.)
- Profile badges or achievements
- Private/public profile toggle
- Profile view analytics
- Custom profile themes (beyond just color)
- Certification uploads
- Project showcase section

## 📝 Notes

- All new fields are optional except `full_name`
- Image uploads use Supabase Storage with unique filenames
- Profile color defaults to blue (#3B82F6) if not set
- Skills are stored as comma-separated text for simplicity
- The profile color is applied consistently throughout the profile UI

## 🐛 Troubleshooting

### Images not uploading?
- Check that the `profile-images` bucket exists in Supabase Storage
- Ensure the bucket is set to public or has appropriate RLS policies
- Verify file size is under limits (5MB for avatars, 10MB for banners)

### Migration fails?
- Ensure you're connected to the correct database
- Check if any columns already exist
- Verify your Supabase connection

### Validation errors?
- Check the browser console for specific error messages
- Ensure URLs include the protocol (https://)
- Verify hex color format includes the # symbol

## 📞 Support

For issues or questions, please check:
1. Browser console for error messages
2. Supabase logs for server-side errors
3. Next.js dev server output for compilation errors
