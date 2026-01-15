-- Fix Count Triggers for Topics
-- Ensures reply_count and view_count update correctly

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_topic_reply_stats_trigger ON replies;
DROP FUNCTION IF EXISTS update_topic_reply_stats();

-- Create function to update topic reply stats
CREATE OR REPLACE FUNCTION update_topic_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment reply count and update last reply info
    UPDATE topics
    SET
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.author_id
    WHERE id = NEW.topic_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement reply count (don't go below 0)
    UPDATE topics
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.topic_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER update_topic_reply_stats_trigger
  AFTER INSERT OR DELETE ON replies
  FOR EACH ROW EXECUTE FUNCTION update_topic_reply_stats();

-- Create increment function for view counts
CREATE OR REPLACE FUNCTION increment(
  table_name TEXT,
  row_id UUID,
  column_name TEXT
)
RETURNS VOID AS $$
DECLARE
  query TEXT;
BEGIN
  query := format('UPDATE %I SET %I = %I + 1 WHERE id = $1', table_name, column_name, column_name);
  EXECUTE query USING row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate existing counts to fix any discrepancies
UPDATE topics t
SET reply_count = (
  SELECT COUNT(*)
  FROM replies r
  WHERE r.topic_id = t.id
);
