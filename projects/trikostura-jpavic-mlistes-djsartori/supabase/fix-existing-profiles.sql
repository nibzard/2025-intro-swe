-- Fix existing profiles with NULL data
-- This script fills in missing profile data for users who signed up before the fix

-- Update profiles where full_name is NULL but username exists
-- Use the username as a fallback for full_name
UPDATE profiles
SET full_name = COALESCE(full_name, username)
WHERE full_name IS NULL 
  AND username IS NOT NULL;

-- Verify the update
SELECT COUNT(*) as updated_profiles, 
       COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as with_full_name
FROM profiles;
