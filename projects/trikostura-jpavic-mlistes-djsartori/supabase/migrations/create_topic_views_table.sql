-- Drop table if it exists (to ensure clean state)
DROP TABLE IF EXISTS topic_views CASCADE;

-- Create topic_views table to track unique views
CREATE TABLE topic_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial unique indexes (only when values are NOT NULL)
CREATE UNIQUE INDEX idx_unique_user_topic_view
  ON topic_views(topic_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_session_topic_view
  ON topic_views(topic_id, session_id)
  WHERE session_id IS NOT NULL;

-- Create indexes for faster lookups
CREATE INDEX idx_topic_views_topic_id ON topic_views(topic_id);
CREATE INDEX idx_topic_views_user_id ON topic_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_topic_views_session_id ON topic_views(session_id) WHERE session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE topic_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (for tracking)
CREATE POLICY "Anyone can record views"
  ON topic_views FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own views
CREATE POLICY "Users can view their own views"
  ON topic_views FOR SELECT
  USING (auth.uid() = user_id OR session_id IS NOT NULL);
