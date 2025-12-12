-- Content Moderation System
-- This migration creates tables and functions for filtering inappropriate content

-- 1. Create table for banned words and phrases
CREATE TABLE IF NOT EXISTS banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('profanity', 'hate_speech', 'harassment', 'spam', 'other')),
  action TEXT NOT NULL CHECK (action IN ('censor', 'flag', 'block')),
  is_regex BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Create index for fast lookup
CREATE INDEX idx_banned_words_active ON banned_words(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_banned_words_severity ON banned_words(severity);

-- 3. Add moderation status columns to topics
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'blocked')),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS auto_flagged BOOLEAN DEFAULT FALSE;

-- 4. Add moderation status columns to replies
ALTER TABLE replies
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'blocked')),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS auto_flagged BOOLEAN DEFAULT FALSE;

-- 5. Create moderation logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('topic', 'reply', 'message')),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('auto_flag', 'manual_flag', 'approve', 'block', 'censor')),
  matched_words TEXT[], -- Array of matched banned words
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason TEXT,
  moderator_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for moderation logs
CREATE INDEX idx_moderation_logs_content ON moderation_logs(content_type, content_id);
CREATE INDEX idx_moderation_logs_user ON moderation_logs(user_id);
CREATE INDEX idx_moderation_logs_created ON moderation_logs(created_at DESC);

-- 7. Create indexes for moderation status
CREATE INDEX idx_topics_moderation_status ON topics(moderation_status) WHERE moderation_status IN ('pending', 'flagged');
CREATE INDEX idx_replies_moderation_status ON replies(moderation_status) WHERE moderation_status IN ('pending', 'flagged');

-- 8. Insert default banned words (Croatian + English profanity)
INSERT INTO banned_words (word, severity, category, action, is_regex) VALUES
  -- Critical profanity - Croatian (block)
  ('kurva', 'critical', 'profanity', 'block', false),
  ('kurac', 'critical', 'profanity', 'block', false),
  ('kurčina', 'critical', 'profanity', 'block', false),
  ('jebem', 'critical', 'profanity', 'block', false),
  ('jebiga', 'high', 'profanity', 'censor', false),
  ('jebote', 'critical', 'profanity', 'block', false),
  ('jebo', 'critical', 'profanity', 'block', false),
  ('pička', 'critical', 'profanity', 'block', false),
  ('pičkin', 'critical', 'profanity', 'block', false),
  ('pičku', 'critical', 'profanity', 'block', false),
  ('picka', 'critical', 'profanity', 'block', false),
  ('peder', 'critical', 'profanity', 'block', false),
  ('pedercina', 'critical', 'profanity', 'block', false),
  ('govno', 'high', 'profanity', 'censor', false),
  ('srati', 'high', 'profanity', 'censor', false),
  ('sranje', 'high', 'profanity', 'censor', false),
  ('seronja', 'high', 'profanity', 'censor', false),
  ('drkadžija', 'medium', 'profanity', 'censor', false),
  ('drolja', 'critical', 'profanity', 'block', false),
  ('kuja', 'high', 'profanity', 'censor', false),
  ('kučka', 'critical', 'profanity', 'block', false),
  ('fukaj', 'critical', 'profanity', 'block', false),
  ('jebi', 'critical', 'profanity', 'block', false),
  ('mater ti jebem', 'critical', 'profanity', 'block', false),
  ('jebem ti', 'critical', 'profanity', 'block', false),
  ('pizda', 'critical', 'profanity', 'block', false),
  ('pizdun', 'critical', 'profanity', 'block', false),

  -- High severity - Croatian (censor)
  ('pas mater', 'high', 'profanity', 'censor', false),
  ('beštija', 'medium', 'profanity', 'censor', false),
  ('budala', 'medium', 'harassment', 'flag', false),
  ('kreten', 'medium', 'harassment', 'flag', false),
  ('marš', 'low', 'harassment', 'flag', false),
  ('odvratno', 'low', 'harassment', 'flag', false),

  -- Critical profanity - English (block)
  ('fuck', 'critical', 'profanity', 'block', false),
  ('fucking', 'critical', 'profanity', 'block', false),
  ('motherfucker', 'critical', 'profanity', 'block', false),
  ('cunt', 'critical', 'profanity', 'block', false),
  ('dick', 'high', 'profanity', 'censor', false),
  ('cock', 'high', 'profanity', 'censor', false),
  ('pussy', 'critical', 'profanity', 'block', false),
  ('asshole', 'high', 'profanity', 'censor', false),
  ('bastard', 'high', 'profanity', 'censor', false),

  -- Medium severity - English (censor)
  ('shit', 'high', 'profanity', 'censor', false),
  ('bitch', 'high', 'profanity', 'censor', false),
  ('damn', 'medium', 'profanity', 'censor', false),
  ('hell', 'low', 'profanity', 'flag', false),
  ('crap', 'medium', 'profanity', 'censor', false),

  -- Hate speech - Croatian (block)
  ('mrzim .+', 'critical', 'hate_speech', 'block', true),
  ('ubij', 'critical', 'hate_speech', 'block', false),
  ('crkni', 'critical', 'hate_speech', 'block', false),
  ('odjebi', 'critical', 'hate_speech', 'block', false),
  ('smrt', 'high', 'hate_speech', 'flag', false),

  -- Harassment - Croatian (flag/censor)
  ('idiot', 'medium', 'harassment', 'flag', false),
  ('glup', 'medium', 'harassment', 'flag', false),
  ('debil', 'high', 'harassment', 'flag', false),
  ('retard', 'high', 'harassment', 'block', false),
  ('mongo', 'high', 'harassment', 'block', false),
  ('mongol', 'high', 'harassment', 'block', false),
  ('imbecil', 'high', 'harassment', 'flag', false),
  ('tupan', 'medium', 'harassment', 'flag', false),
  ('čupavi', 'medium', 'harassment', 'flag', false),
  ('loš', 'low', 'harassment', 'flag', false),

  -- Harassment - English (flag)
  ('stupid', 'medium', 'harassment', 'flag', false),
  ('dumb', 'medium', 'harassment', 'flag', false),
  ('moron', 'high', 'harassment', 'flag', false),
  ('loser', 'medium', 'harassment', 'flag', false),

  -- Spam patterns (flag)
  ('kupi (sada|odmah)', 'medium', 'spam', 'flag', true),
  ('besplatno .+ www\\.', 'medium', 'spam', 'flag', true),
  ('klikni (ovdje|ovde|here)', 'low', 'spam', 'flag', true),
  ('zaradi (novac|pare|eure)', 'medium', 'spam', 'flag', true),
  ('brza zarada', 'medium', 'spam', 'flag', false),
  ('100% zajamčeno', 'medium', 'spam', 'flag', false),
  ('posao od kuće', 'medium', 'spam', 'flag', false),
  ('click here', 'low', 'spam', 'flag', false),
  ('buy now', 'medium', 'spam', 'flag', false),
  ('make money fast', 'medium', 'spam', 'flag', false)
ON CONFLICT (word) DO NOTHING;

-- 9. Create function to check content for banned words
CREATE OR REPLACE FUNCTION check_content_moderation(content_text TEXT)
RETURNS TABLE (
  has_violations BOOLEAN,
  matched_words TEXT[],
  highest_severity TEXT,
  recommended_action TEXT
) AS $$
DECLARE
  v_matched_words TEXT[] := '{}';
  v_highest_severity TEXT := 'low';
  v_recommended_action TEXT := 'approve';
  v_word RECORD;
  v_severity_rank INTEGER := 0;
BEGIN
  -- Check against all active banned words
  FOR v_word IN
    SELECT word, severity, action, is_regex
    FROM banned_words
    WHERE is_active = TRUE
  LOOP
    -- Check if word matches (regex or exact match)
    IF (v_word.is_regex AND content_text ~* v_word.word) OR
       (NOT v_word.is_regex AND LOWER(content_text) LIKE '%' || LOWER(v_word.word) || '%') THEN

      v_matched_words := array_append(v_matched_words, v_word.word);

      -- Determine highest severity
      IF v_word.severity = 'critical' AND v_severity_rank < 4 THEN
        v_highest_severity := 'critical';
        v_severity_rank := 4;
        v_recommended_action := 'block';
      ELSIF v_word.severity = 'high' AND v_severity_rank < 3 THEN
        v_highest_severity := 'high';
        v_severity_rank := 3;
        IF v_word.action = 'block' THEN
          v_recommended_action := 'block';
        ELSIF v_recommended_action != 'block' THEN
          v_recommended_action := v_word.action;
        END IF;
      ELSIF v_word.severity = 'medium' AND v_severity_rank < 2 THEN
        v_highest_severity := 'medium';
        v_severity_rank := 2;
        IF v_recommended_action NOT IN ('block', 'flag') THEN
          v_recommended_action := v_word.action;
        END IF;
      ELSIF v_word.severity = 'low' AND v_severity_rank < 1 THEN
        v_highest_severity := 'low';
        v_severity_rank := 1;
        IF v_recommended_action = 'approve' THEN
          v_recommended_action := v_word.action;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT
    array_length(v_matched_words, 1) > 0,
    v_matched_words,
    v_highest_severity,
    v_recommended_action;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to censor text
CREATE OR REPLACE FUNCTION censor_content(content_text TEXT)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT := content_text;
  v_word RECORD;
  v_replacement TEXT;
BEGIN
  -- Replace banned words with asterisks
  FOR v_word IN
    SELECT word, is_regex, action
    FROM banned_words
    WHERE is_active = TRUE AND action = 'censor'
  LOOP
    IF v_word.is_regex THEN
      -- For regex patterns, replace with [CENSORED]
      v_result := regexp_replace(v_result, v_word.word, '[CENSORED]', 'gi');
    ELSE
      -- For exact words, replace with asterisks of same length
      v_replacement := repeat('*', length(v_word.word));
      v_result := regexp_replace(v_result, v_word.word, v_replacement, 'gi');
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 11. RLS Policies for banned_words (admins only can manage)
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banned words"
  ON banned_words
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can read active banned words"
  ON banned_words
  FOR SELECT
  USING (is_active = TRUE);

-- 12. RLS Policies for moderation_logs (admins can view all, users can view their own)
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all moderation logs"
  ON moderation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own moderation logs"
  ON moderation_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert moderation logs"
  ON moderation_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 13. Grant permissions
GRANT SELECT ON banned_words TO authenticated;
GRANT ALL ON banned_words TO service_role;
GRANT SELECT ON moderation_logs TO authenticated;
GRANT ALL ON moderation_logs TO service_role;

-- 14. Comment tables
COMMENT ON TABLE banned_words IS 'Stores list of banned words and phrases for content moderation';
COMMENT ON TABLE moderation_logs IS 'Logs all moderation actions for audit trail';
COMMENT ON FUNCTION check_content_moderation IS 'Checks content against banned words and returns violation details';
COMMENT ON FUNCTION censor_content IS 'Replaces banned words with censored versions';
