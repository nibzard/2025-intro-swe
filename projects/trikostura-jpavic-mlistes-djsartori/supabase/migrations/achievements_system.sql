-- Achievement Badges System
-- Gamification layer for user engagement

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Index for fast user achievement lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);

-- ============================================
-- ACTIVITY TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  topics_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  upvotes_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON user_activity(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity(activity_date DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update user activity (called by triggers)
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update activity for today
  INSERT INTO user_activity (user_id, activity_date, topics_count, replies_count)
  VALUES (
    NEW.author_id,
    CURRENT_DATE,
    CASE WHEN TG_TABLE_NAME = 'topics' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'replies' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    topics_count = user_activity.topics_count + CASE WHEN TG_TABLE_NAME = 'topics' THEN 1 ELSE 0 END,
    replies_count = user_activity.replies_count + CASE WHEN TG_TABLE_NAME = 'replies' THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for tracking topic creation
DROP TRIGGER IF EXISTS trigger_track_topic_activity ON topics;
CREATE TRIGGER trigger_track_topic_activity
  AFTER INSERT ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_user_activity();

-- Trigger for tracking reply creation
DROP TRIGGER IF EXISTS trigger_track_reply_activity ON replies;
CREATE TRIGGER trigger_track_reply_activity
  AFTER INSERT ON replies
  FOR EACH ROW
  EXECUTE FUNCTION update_user_activity();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- User achievements policies
CREATE POLICY "Users can view all achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User activity policies
CREATE POLICY "Users can view all activity"
  ON user_activity FOR SELECT
  USING (true);

CREATE POLICY "System can manage activity"
  ON user_activity FOR ALL
  USING (true);

-- ============================================
-- ACHIEVEMENT DEFINITIONS
-- ============================================

-- Achievements are defined in code, not database
-- This allows for easier updates and logic

COMMENT ON TABLE user_achievements IS 'Tracks which achievements users have earned';
COMMENT ON TABLE user_activity IS 'Daily activity tracking for contribution calendar and streaks';

-- ============================================
-- INITIAL DATA MIGRATION
-- ============================================

-- Backfill activity data from existing topics and replies
INSERT INTO user_activity (user_id, activity_date, topics_count, replies_count)
SELECT
  author_id,
  DATE(created_at) as activity_date,
  COUNT(*) as topics_count,
  0 as replies_count
FROM topics
GROUP BY author_id, DATE(created_at)
ON CONFLICT (user_id, activity_date)
DO UPDATE SET
  topics_count = user_activity.topics_count + EXCLUDED.topics_count;

INSERT INTO user_activity (user_id, activity_date, topics_count, replies_count)
SELECT
  author_id,
  DATE(created_at) as activity_date,
  0 as topics_count,
  COUNT(*) as replies_count
FROM replies
GROUP BY author_id, DATE(created_at)
ON CONFLICT (user_id, activity_date)
DO UPDATE SET
  replies_count = user_activity.replies_count + EXCLUDED.replies_count;

-- Analyze tables
ANALYZE user_achievements;
ANALYZE user_activity;
