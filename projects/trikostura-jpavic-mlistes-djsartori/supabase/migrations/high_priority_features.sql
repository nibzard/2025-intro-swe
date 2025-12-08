-- High Priority Features Migration
-- 1. Bookmarks table
-- 2. Reports table
-- 3. Solution marking improvements (topic has_solution column)

-- =====================================================
-- BOOKMARKS
-- =====================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can create own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;

-- Users can see their own bookmarks
CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_topic_id ON bookmarks(topic_id);

-- =====================================================
-- REPORTS
-- =====================================================
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_type AS ENUM ('spam', 'harassment', 'inappropriate', 'misinformation', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,
  description TEXT,
  status report_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure either topic_id or reply_id is set, but not both
  CONSTRAINT report_target_check CHECK (
    (topic_id IS NOT NULL AND reply_id IS NULL) OR
    (topic_id IS NULL AND reply_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins can update reports
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_topic_id ON reports(topic_id);
CREATE INDEX IF NOT EXISTS idx_reports_reply_id ON reports(reply_id);

-- =====================================================
-- SOLUTION MARKING IMPROVEMENTS
-- =====================================================
-- Add has_solution column to topics for quick querying
ALTER TABLE topics ADD COLUMN IF NOT EXISTS has_solution BOOLEAN DEFAULT FALSE;

-- Create a trigger to update has_solution when a reply is marked as solution
CREATE OR REPLACE FUNCTION update_topic_has_solution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_solution = TRUE THEN
    -- Mark topic as having a solution
    UPDATE topics SET has_solution = TRUE WHERE id = NEW.topic_id;
    -- Unmark any other solutions for this topic
    UPDATE replies SET is_solution = FALSE
    WHERE topic_id = NEW.topic_id AND id != NEW.id AND is_solution = TRUE;
  ELSIF OLD.is_solution = TRUE AND NEW.is_solution = FALSE THEN
    -- Check if there are any other solutions
    UPDATE topics SET has_solution = EXISTS(
      SELECT 1 FROM replies WHERE topic_id = OLD.topic_id AND is_solution = TRUE AND id != OLD.id
    ) WHERE id = OLD.topic_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_has_solution ON replies;
CREATE TRIGGER trigger_update_topic_has_solution
  AFTER UPDATE OF is_solution ON replies
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_has_solution();

-- Update existing topics that have solutions
UPDATE topics t SET has_solution = TRUE
WHERE EXISTS (SELECT 1 FROM replies r WHERE r.topic_id = t.id AND r.is_solution = TRUE);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON reports;
CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
