-- Fix RLS policy for user_achievements table
-- This allows server-side code to insert achievements for any user

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;

-- Create a permissive policy that allows:
-- 1. Users to insert their own achievements
-- 2. Authenticated users to insert achievements for others (server-side operations)
CREATE POLICY "Allow achievement insertion"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Alternative: If you want to restrict to only own achievements + service role
-- CREATE POLICY "Users can insert achievements"
--   ON user_achievements FOR INSERT
--   WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');
