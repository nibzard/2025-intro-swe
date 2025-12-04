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

-- ============================================
-- STORAGE BUCKET SETUP (Do this in Supabase Dashboard)
-- ============================================
--
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: attachments
-- 4. Make it Public: YES (toggle ON)
-- 5. Click "Create bucket"
--
-- 6. After creating bucket, click on "attachments" bucket
-- 7. Go to "Policies" tab
-- 8. Click "New Policy"
--
-- Policy 1: Allow authenticated users to upload
--   - Policy name: Authenticated users can upload
--   - Allowed operation: INSERT
--   - Target roles: authenticated
--   - USING expression: true
--   - WITH CHECK expression: (bucket_id = 'attachments')
--
-- Policy 2: Allow everyone to read/download
--   - Policy name: Anyone can download
--   - Allowed operation: SELECT
--   - Target roles: public
--   - USING expression: true
--
-- OR use the "Simple" policy template:
-- - "Allow public read access" (for downloads)
-- - "Allow authenticated uploads" (for uploads)
