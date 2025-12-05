-- =====================================================
-- COMPREHENSIVE FEATURES MIGRATION
-- =====================================================

-- =====================================================
-- 1. USER PROFILE ENHANCEMENTS
-- =====================================================

-- Add profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_posts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_replies INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- Saved topics (bookmarks)
CREATE TABLE IF NOT EXISTS saved_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, topic_id)
);

-- =====================================================
-- 2. TOPIC SUBSCRIPTIONS & NOTIFICATIONS
-- =====================================================

-- Topic subscriptions
CREATE TABLE IF NOT EXISTS topic_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  notify_email BOOLEAN DEFAULT false,
  notify_app BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, topic_id)
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_replies BOOLEAN DEFAULT true,
  email_mentions BOOLEAN DEFAULT true,
  email_subscriptions BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  email_digest_frequency VARCHAR(20) DEFAULT 'weekly',
  app_replies BOOLEAN DEFAULT true,
  app_mentions BOOLEAN DEFAULT true,
  app_subscriptions BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 3. GAMIFICATION SYSTEM
-- =====================================================

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  rarity VARCHAR(20) DEFAULT 'common',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_value INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 4. SOCIAL FEATURES
-- =====================================================

-- Direct messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Reactions
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK ((reply_id IS NOT NULL AND topic_id IS NULL) OR (reply_id IS NULL AND topic_id IS NOT NULL))
);

-- =====================================================
-- 5. MODERATION TOOLS
-- =====================================================

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User warnings
CREATE TABLE IF NOT EXISTS user_warnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User bans
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  banned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  ban_type VARCHAR(20) DEFAULT 'temporary',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 6. TOPIC FEATURES
-- =====================================================

-- Polls
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL UNIQUE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  multiple_choice BOOLEAN DEFAULT false,
  closes_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Topic templates
CREATE TABLE IF NOT EXISTS topic_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  template_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- 7. ANALYTICS
-- =====================================================

-- Topic views tracking
CREATE TABLE IF NOT EXISTS topic_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_saved_topics_user ON saved_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_topics_topic ON saved_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON topic_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_topic ON topic_subscriptions(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_reactions_reply ON reactions(reply_id);
CREATE INDEX IF NOT EXISTS idx_reactions_topic ON reactions(topic_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_topic_views_topic ON topic_views(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_views_created ON topic_views(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON user_activity_log(user_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Saved topics
ALTER TABLE saved_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own saved topics" ON saved_topics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can save topics" ON saved_topics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unsave topics" ON saved_topics FOR DELETE USING (user_id = auth.uid());

-- Topic subscriptions
ALTER TABLE topic_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscriptions" ON topic_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can subscribe to topics" ON topic_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unsubscribe from topics" ON topic_subscriptions FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Users can update their subscriptions" ON topic_subscriptions FOR UPDATE USING (user_id = auth.uid());

-- Notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own preferences" ON notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their preferences" ON notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their preferences" ON notification_preferences FOR UPDATE USING (user_id = auth.uid());

-- Badges (read-only for all)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- User badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Recipients can mark messages as read" ON messages FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "Senders can delete their sent messages" ON messages FOR DELETE USING (sender_id = auth.uid());

-- User follows
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can unfollow" ON user_follows FOR DELETE USING (follower_id = auth.uid());

-- Reactions
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON reactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove their reactions" ON reactions FOR DELETE USING (user_id = auth.uid());

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Topic authors can create polls" ON polls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM topics WHERE id = polls.topic_id AND author_id = auth.uid())
);

-- Poll votes
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view poll results" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote on polls" ON poll_votes FOR INSERT WITH CHECK (user_id = auth.uid());

-- Topic templates (read-only for all, admins can manage)
ALTER TABLE topic_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view templates" ON topic_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON topic_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default badges
INSERT INTO badges (name, slug, description, icon, color, requirement_type, requirement_value, rarity) VALUES
  ('Első Hozzászólás', 'first-post', 'Készítsd el az első témádat', '🎯', '#3B82F6', 'topics_created', 1, 'common'),
  ('Első Válasz', 'first-reply', 'Írj az első válaszodat', '💬', '#10B981', 'replies_created', 1, 'common'),
  ('Aktív Tag', 'active-member', 'Készíts 10 témát', '⭐', '#F59E0B', 'topics_created', 10, 'uncommon'),
  ('Segítőkész', 'helpful', '50 válasz írva', '🤝', '#8B5CF6', 'replies_created', 50, 'uncommon'),
  ('Szakértő', 'expert', '100 válasz írva', '👨‍🎓', '#EC4899', 'replies_created', 100, 'rare'),
  ('Megoldás Mester', 'solution-master', '10 válaszod lett megoldásnak jelölve', '✅', '#10B981', 'solutions_given', 10, 'rare'),
  ('Népszerű', 'popular', 'Szerezz 100 felszavazást', '🔥', '#EF4444', 'upvotes_received', 100, 'rare'),
  ('Legend', 'legend', '500 hozzászólás és 1000 reputation', '👑', '#F59E0B', 'reputation', 1000, 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- Insert default topic templates
INSERT INTO topic_templates (name, description, template_content, is_active) VALUES
  ('Általános Kérdés', 'Alapvető kérdés sablon', E'## Kérdésem\n\n[Írd le a kérdésedet]\n\n## Amit már kipróbáltam\n\n[Lista arról, mit próbáltál már]\n\n## Kapcsolódó információk\n\n[További részletek]', true),
  ('Hibakeresés', 'Technikai probléma jelentése', E'## Probléma leírása\n\n[Mi a probléma?]\n\n## Hibaüzenet\n\n```\n[Illeszd be a hibaüzenetet]\n```\n\n## Lépések a reprodukáláshoz\n\n1. \n2. \n3. \n\n## Környezet\n\n- OS: \n- Verzió: ', true),
  ('Projekt Bemutató', 'Mutasd be a projektedet', E'## Projekt címe\n\n[A projekt neve]\n\n## Leírás\n\n[Rövid leírás a projektről]\n\n## Technológiák\n\n- \n- \n\n## Link\n\n[GitHub/Demo link]\n\n## Screenshot\n\n[Képek a projektről]', true)
ON CONFLICT DO NOTHING;
