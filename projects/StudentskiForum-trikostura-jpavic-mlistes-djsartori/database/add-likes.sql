-- Migration: Add likes/upvotes functionality

-- Create topic_likes table
CREATE TABLE IF NOT EXISTS topic_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id) -- Ensure user can only like a topic once
);

-- Create index for better performance
CREATE INDEX idx_topic_likes_topic ON topic_likes(topic_id);
CREATE INDEX idx_topic_likes_user ON topic_likes(user_id);

-- Add like_count column to topics table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'topics' AND column_name = 'like_count')
  THEN
    ALTER TABLE topics ADD COLUMN like_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on topic_likes table
ALTER TABLE topic_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topic_likes
CREATE POLICY "Topic likes are viewable by everyone" ON topic_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add likes" ON topic_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON topic_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update topic like count
CREATE OR REPLACE FUNCTION update_topic_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE topics
    SET like_count = like_count + 1
    WHERE id = NEW.topic_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE topics
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.topic_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update like count
DROP TRIGGER IF EXISTS topic_likes_count_trigger ON topic_likes;
CREATE TRIGGER topic_likes_count_trigger
  AFTER INSERT OR DELETE ON topic_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_like_count();

-- Initialize like_count for existing topics
UPDATE topics
SET like_count = (
  SELECT COUNT(*)
  FROM topic_likes
  WHERE topic_likes.topic_id = topics.id
)
WHERE like_count IS NULL OR like_count = 0;
