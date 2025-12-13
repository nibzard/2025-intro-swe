-- User Warnings/Timeout System Migration
-- Adds ability for admins to warn users and set temporary timeouts

-- Add warning/timeout columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_warning_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timeout_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timeout_reason TEXT;

-- Create warnings table to track warning history
CREATE TABLE IF NOT EXISTS user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  warning_type TEXT NOT NULL DEFAULT 'warning', -- 'warning' or 'timeout'
  timeout_duration INTEGER, -- in hours, null for warnings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

-- Users can view their own warnings
DROP POLICY IF EXISTS "Users can view own warnings" ON user_warnings;
CREATE POLICY "Users can view own warnings" ON user_warnings
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all warnings
DROP POLICY IF EXISTS "Admins can view all warnings" ON user_warnings;
CREATE POLICY "Admins can view all warnings" ON user_warnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create warnings
DROP POLICY IF EXISTS "Admins can create warnings" ON user_warnings;
CREATE POLICY "Admins can create warnings" ON user_warnings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_timeout_until ON profiles(timeout_until) WHERE timeout_until IS NOT NULL;
