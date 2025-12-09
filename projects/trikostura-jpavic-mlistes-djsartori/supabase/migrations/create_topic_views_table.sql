-- Create topic_views table to track unique views
CREATE TABLE IF NOT EXISTS topic_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_topic_view UNIQUE (topic_id, user_id),
  CONSTRAINT unique_session_topic_view UNIQUE (topic_id, session_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_topic_views_topic_id ON topic_views(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_views_user_id ON topic_views(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_views_session_id ON topic_views(session_id);

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
