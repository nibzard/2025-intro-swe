-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- in bytes
  file_type TEXT NOT NULL, -- MIME type
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: attachment must belong to either a topic or reply, but not both
  CONSTRAINT attachment_target CHECK (
    (topic_id IS NOT NULL AND reply_id IS NULL) OR
    (topic_id IS NULL AND reply_id IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_attachments_topic_id ON attachments(topic_id);
CREATE INDEX idx_attachments_reply_id ON attachments(reply_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view attachments
CREATE POLICY "Attachments are viewable by everyone"
  ON attachments FOR SELECT
  USING (true);

-- Only authenticated users can upload attachments
CREATE POLICY "Authenticated users can upload attachments"
  ON attachments FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON attachments FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Storage bucket setup instructions:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket called 'attachments'
-- 3. Set it to Public (for easy file access)
-- 4. Add these policies:

-- Storage Policies (run in SQL Editor):
-- Allow authenticated users to upload files
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated users can upload attachments',
  'attachments',
  '{
    "with_check": "(auth.role() = ''authenticated'')",
    "using": "(auth.role() = ''authenticated'')"
  }'::jsonb
);

-- Allow everyone to download files
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Anyone can download attachments',
  'attachments',
  '{
    "using": "true"
  }'::jsonb
);
