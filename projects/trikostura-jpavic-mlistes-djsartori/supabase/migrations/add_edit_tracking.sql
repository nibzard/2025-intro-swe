-- Add edited_at column to replies table for tracking edits
ALTER TABLE replies ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Add edited_at column to topics (in case migration wasn't run)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Update type definitions to include edited_at
COMMENT ON COLUMN topics.edited_at IS 'Timestamp of last edit (null if never edited)';
COMMENT ON COLUMN replies.edited_at IS 'Timestamp of last edit (null if never edited)';
