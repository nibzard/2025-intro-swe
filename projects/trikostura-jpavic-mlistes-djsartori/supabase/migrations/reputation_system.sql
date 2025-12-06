-- Reputation System Migration
-- This migration creates a comprehensive reputation system that automatically updates user reputation
-- based on various activities: votes, solutions, topic creation, and reply creation.

-- REPUTATION POINTS SYSTEM:
-- Reply upvote received: +5 points
-- Reply downvote received: -2 points
-- Reply marked as solution: +15 points
-- Reply unmarked as solution: -15 points
-- Create topic: +2 points
-- Create reply: +1 point
-- Delete topic: -2 points
-- Delete reply: -1 point

-- =====================================================
-- 1. FUNCTION: Update reputation for vote changes
-- =====================================================
CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  reply_author_id UUID;
  upvote_points INTEGER := 5;
  downvote_points INTEGER := -2;
BEGIN
  -- Get the author of the reply being voted on
  SELECT author_id INTO reply_author_id
  FROM replies
  WHERE id = COALESCE(NEW.reply_id, OLD.reply_id);

  -- Don't allow users to vote on their own replies (reputation-wise)
  IF reply_author_id = COALESCE(NEW.user_id, OLD.user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- New vote: add reputation
    IF NEW.vote_type = 1 THEN
      UPDATE profiles SET reputation = reputation + upvote_points WHERE id = reply_author_id;
    ELSE
      UPDATE profiles SET reputation = reputation + downvote_points WHERE id = reply_author_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Vote removed: subtract reputation
    IF OLD.vote_type = 1 THEN
      UPDATE profiles SET reputation = reputation - upvote_points WHERE id = reply_author_id;
    ELSE
      UPDATE profiles SET reputation = reputation - downvote_points WHERE id = reply_author_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Vote changed: adjust reputation
    IF OLD.vote_type = 1 AND NEW.vote_type = -1 THEN
      -- Changed from upvote to downvote
      UPDATE profiles SET reputation = reputation - upvote_points + downvote_points WHERE id = reply_author_id;
    ELSIF OLD.vote_type = -1 AND NEW.vote_type = 1 THEN
      -- Changed from downvote to upvote
      UPDATE profiles SET reputation = reputation - downvote_points + upvote_points WHERE id = reply_author_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FUNCTION: Update reputation when reply is marked/unmarked as solution
-- =====================================================
CREATE OR REPLACE FUNCTION update_reputation_on_solution()
RETURNS TRIGGER AS $$
DECLARE
  solution_points INTEGER := 15;
BEGIN
  -- Only process if is_solution changed
  IF OLD.is_solution = NEW.is_solution THEN
    RETURN NEW;
  END IF;

  IF NEW.is_solution = TRUE THEN
    -- Reply marked as solution: add reputation
    UPDATE profiles SET reputation = reputation + solution_points WHERE id = NEW.author_id;
  ELSE
    -- Reply unmarked as solution: subtract reputation
    UPDATE profiles SET reputation = reputation - solution_points WHERE id = NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FUNCTION: Update reputation when topic is created/deleted
-- =====================================================
CREATE OR REPLACE FUNCTION update_reputation_on_topic()
RETURNS TRIGGER AS $$
DECLARE
  topic_points INTEGER := 2;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Topic created: add reputation
    UPDATE profiles SET reputation = reputation + topic_points WHERE id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Topic deleted: subtract reputation
    UPDATE profiles SET reputation = reputation - topic_points WHERE id = OLD.author_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNCTION: Update reputation when reply is created/deleted
-- =====================================================
CREATE OR REPLACE FUNCTION update_reputation_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  reply_points INTEGER := 1;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Reply created: add reputation
    UPDATE profiles SET reputation = reputation + reply_points WHERE id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reply deleted: subtract reputation
    UPDATE profiles SET reputation = reputation - reply_points WHERE id = OLD.author_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. DROP OLD TRIGGERS (if they exist)
-- =====================================================
DROP TRIGGER IF EXISTS reputation_on_vote_trigger ON votes;
DROP TRIGGER IF EXISTS reputation_on_solution_trigger ON replies;
DROP TRIGGER IF EXISTS reputation_on_topic_trigger ON topics;
DROP TRIGGER IF EXISTS reputation_on_reply_trigger ON replies;

-- =====================================================
-- 6. CREATE NEW TRIGGERS
-- =====================================================

-- Trigger for votes (upvotes/downvotes)
CREATE TRIGGER reputation_on_vote_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_on_vote();

-- Trigger for solutions (must be BEFORE update_reply_vote_counts_trigger)
CREATE TRIGGER reputation_on_solution_trigger
  AFTER UPDATE ON replies
  FOR EACH ROW
  WHEN (OLD.is_solution IS DISTINCT FROM NEW.is_solution)
  EXECUTE FUNCTION update_reputation_on_solution();

-- Trigger for topic creation/deletion
CREATE TRIGGER reputation_on_topic_trigger
  AFTER INSERT OR DELETE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_on_topic();

-- Trigger for reply creation/deletion
CREATE TRIGGER reputation_on_reply_trigger
  AFTER INSERT OR DELETE ON replies
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_on_reply();

-- =====================================================
-- 7. FUNCTION: Recalculate reputation for a user (backfill)
-- =====================================================
CREATE OR REPLACE FUNCTION recalculate_user_reputation(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_reputation INTEGER := 0;
  upvote_count INTEGER;
  downvote_count INTEGER;
  solution_count INTEGER;
  topic_count INTEGER;
  reply_count INTEGER;
BEGIN
  -- Count upvotes received on user's replies
  SELECT COUNT(*) INTO upvote_count
  FROM votes v
  INNER JOIN replies r ON v.reply_id = r.id
  WHERE r.author_id = p_user_id AND v.vote_type = 1;

  -- Count downvotes received on user's replies
  SELECT COUNT(*) INTO downvote_count
  FROM votes v
  INNER JOIN replies r ON v.reply_id = r.id
  WHERE r.author_id = p_user_id AND v.vote_type = -1;

  -- Count solutions by user
  SELECT COUNT(*) INTO solution_count
  FROM replies
  WHERE author_id = p_user_id AND is_solution = TRUE;

  -- Count topics by user
  SELECT COUNT(*) INTO topic_count
  FROM topics
  WHERE author_id = p_user_id;

  -- Count replies by user
  SELECT COUNT(*) INTO reply_count
  FROM replies
  WHERE author_id = p_user_id;

  -- Calculate total reputation
  total_reputation :=
    (upvote_count * 5) +        -- +5 per upvote
    (downvote_count * -2) +      -- -2 per downvote
    (solution_count * 15) +      -- +15 per solution
    (topic_count * 2) +          -- +2 per topic
    (reply_count * 1);           -- +1 per reply

  -- Update user's reputation
  UPDATE profiles SET reputation = total_reputation WHERE id = p_user_id;

  RETURN total_reputation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNCTION: Recalculate reputation for ALL users (backfill)
-- =====================================================
CREATE OR REPLACE FUNCTION recalculate_all_reputations()
RETURNS TABLE(user_id UUID, username TEXT, new_reputation INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    recalculate_user_reputation(p.id)
  FROM profiles p
  ORDER BY p.reputation DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. BACKFILL: Recalculate reputation for all existing users
-- =====================================================
SELECT recalculate_all_reputations();

-- =====================================================
-- 10. CREATE VIEW: User reputation breakdown
-- =====================================================
CREATE OR REPLACE VIEW user_reputation_breakdown AS
SELECT
  p.id,
  p.username,
  p.reputation,
  COUNT(DISTINCT t.id) AS topic_count,
  COUNT(DISTINCT r.id) AS reply_count,
  COUNT(DISTINCT CASE WHEN v.vote_type = 1 THEN v.id END) AS upvotes_received,
  COUNT(DISTINCT CASE WHEN v.vote_type = -1 THEN v.id END) AS downvotes_received,
  COUNT(DISTINCT CASE WHEN r.is_solution = TRUE THEN r.id END) AS solutions_count,
  -- Calculated reputation (for verification)
  (COUNT(DISTINCT t.id) * 2) +
  (COUNT(DISTINCT r.id) * 1) +
  (COUNT(DISTINCT CASE WHEN v.vote_type = 1 THEN v.id END) * 5) +
  (COUNT(DISTINCT CASE WHEN v.vote_type = -1 THEN v.id END) * -2) +
  (COUNT(DISTINCT CASE WHEN r.is_solution = TRUE THEN r.id END) * 15) AS calculated_reputation
FROM profiles p
LEFT JOIN topics t ON t.author_id = p.id
LEFT JOIN replies r ON r.author_id = p.id
LEFT JOIN votes v ON v.reply_id = r.id
GROUP BY p.id, p.username, p.reputation
ORDER BY p.reputation DESC;

-- Grant access to the view
GRANT SELECT ON user_reputation_breakdown TO authenticated;
