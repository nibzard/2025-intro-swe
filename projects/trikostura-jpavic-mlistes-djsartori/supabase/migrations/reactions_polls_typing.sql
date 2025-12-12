-- =====================================================
-- EMOJI REACTIONS SYSTEM
-- =====================================================

-- Drop old reactions table if it exists
DROP TABLE IF EXISTS reactions CASCADE;

-- Reactions table (for replies and topics)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL, -- Emoji character (👍, ❤️, 😂, 🎯, 🔥, 👏)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure user can only react once with same emoji to same item
  CONSTRAINT unique_user_reaction UNIQUE(user_id, reply_id, topic_id, emoji),
  -- Ensure reaction is either on reply OR topic, not both
  CONSTRAINT reaction_target_check CHECK (
    (reply_id IS NOT NULL AND topic_id IS NULL) OR
    (reply_id IS NULL AND topic_id IS NOT NULL)
  )
);

-- Indexes for fast reaction queries
CREATE INDEX idx_reactions_reply ON reactions(reply_id) WHERE reply_id IS NOT NULL;
CREATE INDEX idx_reactions_topic ON reactions(topic_id) WHERE topic_id IS NOT NULL;
CREATE INDEX idx_reactions_user ON reactions(user_id);
CREATE INDEX idx_reactions_emoji ON reactions(emoji);

-- RLS Policies for reactions
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON reactions;
CREATE POLICY "Anyone can view reactions"
  ON reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can add their own reactions" ON reactions;
CREATE POLICY "Users can add their own reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;
CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POLLS SYSTEM
-- =====================================================

-- Drop old polls tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS poll_votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;

-- Polls table (attached to topics)
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  allow_multiple_choices BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_poll_question CHECK (length(trim(question)) > 0)
);

-- Poll options
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_option_text CHECK (length(trim(option_text)) > 0),
  CONSTRAINT unique_poll_position UNIQUE(poll_id, position)
);

-- Poll votes
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For single-choice polls, user can only vote once
  CONSTRAINT unique_user_vote_single UNIQUE(poll_id, user_id, option_id)
);

-- Indexes for polls
CREATE INDEX idx_polls_topic ON polls(topic_id);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id, position);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_option ON poll_votes(option_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);

-- RLS Policies for polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view polls" ON polls;
CREATE POLICY "Anyone can view polls"
  ON polls FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create polls" ON polls;
CREATE POLICY "Authenticated users can create polls"
  ON polls FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Poll creator can update their polls" ON polls;
CREATE POLICY "Poll creator can update their polls"
  ON polls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = polls.topic_id
      AND topics.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Poll creator can delete their polls" ON polls;
CREATE POLICY "Poll creator can delete their polls"
  ON polls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = polls.topic_id
      AND topics.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view poll options" ON poll_options;
CREATE POLICY "Anyone can view poll options"
  ON poll_options FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create poll options" ON poll_options;
CREATE POLICY "Authenticated users can create poll options"
  ON poll_options FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view poll votes" ON poll_votes;
CREATE POLICY "Anyone can view poll votes"
  ON poll_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote" ON poll_votes;
CREATE POLICY "Authenticated users can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON poll_votes;
CREATE POLICY "Users can delete their own votes"
  ON poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TYPING INDICATORS SYSTEM
-- =====================================================

-- Typing indicators (lightweight, auto-expire)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_typing UNIQUE(topic_id, user_id)
);

-- Index for fast typing indicator queries
CREATE INDEX IF NOT EXISTS idx_typing_topic ON typing_indicators(topic_id, updated_at);

-- RLS Policies for typing indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view typing indicators" ON typing_indicators;
CREATE POLICY "Anyone can view typing indicators"
  ON typing_indicators FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_indicators;
CREATE POLICY "Users can update their own typing status"
  ON typing_indicators FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to clean up old typing indicators (older than 5 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get reaction counts for a reply
CREATE OR REPLACE FUNCTION get_reply_reaction_counts(reply_uuid UUID)
RETURNS TABLE(emoji VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.emoji, COUNT(*)::BIGINT
  FROM reactions r
  WHERE r.reply_id = reply_uuid
  GROUP BY r.emoji
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get reaction counts for a topic
CREATE OR REPLACE FUNCTION get_topic_reaction_counts(topic_uuid UUID)
RETURNS TABLE(emoji VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.emoji, COUNT(*)::BIGINT
  FROM reactions r
  WHERE r.topic_id = topic_uuid
  GROUP BY r.emoji
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid UUID)
RETURNS TABLE(
  option_id UUID,
  option_text TEXT,
  vote_count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH vote_counts AS (
    SELECT po.id, COUNT(pv.id)::BIGINT as votes
    FROM poll_options po
    LEFT JOIN poll_votes pv ON pv.option_id = po.id
    WHERE po.poll_id = poll_uuid
    GROUP BY po.id
  ),
  total_votes AS (
    SELECT COALESCE(SUM(votes), 0) as total
    FROM vote_counts
  )
  SELECT 
    po.id,
    po.option_text,
    COALESCE(vc.votes, 0),
    CASE 
      WHEN tv.total = 0 THEN 0
      ELSE ROUND((vc.votes::NUMERIC / tv.total::NUMERIC) * 100, 1)
    END
  FROM poll_options po
  LEFT JOIN vote_counts vc ON vc.id = po.id
  CROSS JOIN total_votes tv
  WHERE po.poll_id = poll_uuid
  ORDER BY po.position;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_reply_reaction_counts TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_topic_reaction_counts TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_poll_results TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_old_typing_indicators TO authenticated;
