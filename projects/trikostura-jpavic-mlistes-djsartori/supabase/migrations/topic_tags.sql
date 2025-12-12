-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Topic tags junction table
CREATE TABLE IF NOT EXISTS topic_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(topic_id, tag_id)
);

-- Topic drafts table
CREATE TABLE IF NOT EXISTS topic_drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  content TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add is_draft column to topics if it doesn't exist
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Add edited_at column to topics if it doesn't exist
ALTER TABLE topics ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_drafts ENABLE ROW LEVEL SECURITY;

-- Policies for tags (read-only for all, write for admins)
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert tags"
  ON tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for topic_tags
CREATE POLICY "Anyone can view topic tags"
  ON topic_tags FOR SELECT
  USING (true);

CREATE POLICY "Topic authors can add tags to their topics"
  ON topic_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_tags.topic_id
      AND topics.author_id = auth.uid()
    )
  );

CREATE POLICY "Topic authors can remove tags from their topics"
  ON topic_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_tags.topic_id
      AND topics.author_id = auth.uid()
    )
  );

-- Policies for topic_drafts
CREATE POLICY "Users can view their own drafts"
  ON topic_drafts FOR SELECT
  USING (author_id = auth.uid());

CREATE POLICY "Users can create their own drafts"
  ON topic_drafts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own drafts"
  ON topic_drafts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own drafts"
  ON topic_drafts FOR DELETE
  USING (author_id = auth.uid());

-- Insert some default tags
INSERT INTO tags (name, slug, color) VALUES
  ('Pitanje', 'pitanje', '#3B82F6'),
  ('Diskusija', 'diskusija', '#8B5CF6'),
  ('Pomoć', 'pomoc', '#EF4444'),
  ('Savjet', 'savjet', '#10B981'),
  ('Novost', 'novost', '#F59E0B'),
  ('Tutorial', 'tutorial', '#06B6D4'),
  ('Projekt', 'projekt', '#EC4899'),
  ('Istraživanje', 'istrazivanje', '#6366F1')
ON CONFLICT (slug) DO NOTHING;
