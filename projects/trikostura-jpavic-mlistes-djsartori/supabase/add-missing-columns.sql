-- Add missing columns to profiles table

-- First, create the user_role enum type if it doesn't exist
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Add the role column with default 'student'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'student';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
