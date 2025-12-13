-- Check if user_role type exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'pg_type'
);

-- Check the actual role column definition
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- Check what roles exist in the enum type
SELECT enum_range(NULL::user_role);

-- See all role values in profiles
SELECT DISTINCT role FROM profiles;

-- Count users by role
SELECT role, COUNT(*) as count FROM profiles GROUP BY role;
