-- =====================================================
-- AI STUDY ASSISTANT SYSTEM
-- =====================================================

-- AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, -- Optional title for the conversation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context_data JSONB, -- Store any context (related topics, forum posts, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at DESC);

-- RLS Policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON ai_conversations;
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own conversations
DROP POLICY IF EXISTS "Users can create their own conversations" ON ai_conversations;
CREATE POLICY "Users can create their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
DROP POLICY IF EXISTS "Users can update their own conversations" ON ai_conversations;
CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own conversations
DROP POLICY IF EXISTS "Users can delete their own conversations" ON ai_conversations;
CREATE POLICY "Users can delete their own conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON ai_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Users can create messages in their conversations
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON ai_messages;
CREATE POLICY "Users can create messages in their conversations"
  ON ai_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when message is added
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON ai_messages;
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Grant permissions
GRANT ALL ON ai_conversations TO authenticated;
GRANT ALL ON ai_messages TO authenticated;
GRANT ALL ON ai_conversations TO service_role;
GRANT ALL ON ai_messages TO service_role;

-- Comments
COMMENT ON TABLE ai_conversations IS 'Stores AI assistant conversation sessions';
COMMENT ON TABLE ai_messages IS 'Stores individual messages in AI conversations';
COMMENT ON COLUMN ai_messages.context_data IS 'JSON data with context (related forum topics, course info, etc.)';
