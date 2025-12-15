-- Apply all performance indexes if not already done
-- Run this in Supabase SQL Editor

-- Performance Indexes Migration
-- Created to optimize common query patterns and eliminate N+1 queries
-- Run this migration to significantly improve database performance

-- ============================================
-- PROFILES TABLE INDEXES
-- ============================================

-- Username lookups (case-insensitive searches)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
ON profiles(LOWER(username));

-- Email lookups (used in auth and password reset)
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
ON profiles(LOWER(email));

-- ============================================
-- TOPICS TABLE INDEXES
-- ============================================

-- Category page - most common query (category + created_at sorting)
CREATE INDEX IF NOT EXISTS idx_topics_category_created
ON topics(category_id, created_at DESC)
WHERE is_locked = false;

-- Trending/hot topics (created_at + view_count)
CREATE INDEX IF NOT EXISTS idx_topics_created_views
ON topics(created_at DESC, view_count DESC)
WHERE is_locked = false;

-- User's topics page
CREATE INDEX IF NOT EXISTS idx_topics_author_created
ON topics(author_id, created_at DESC);

-- Search by slug (unique lookups)
CREATE INDEX IF NOT EXISTS idx_topics_slug
ON topics(slug);

-- Pinned topics filtering
CREATE INDEX IF NOT EXISTS idx_topics_pinned_category
ON topics(is_pinned, category_id, created_at DESC)
WHERE is_pinned = true;

-- ============================================
-- REPLIES TABLE INDEXES
-- ============================================

-- Topic page - fetch all replies for a topic (most common query)
CREATE INDEX IF NOT EXISTS idx_replies_topic_created
ON replies(topic_id, created_at DESC);

-- User's replies page
CREATE INDEX IF NOT EXISTS idx_replies_author_created
ON replies(author_id, created_at DESC);

-- Parent reply lookups (threaded replies)
CREATE INDEX IF NOT EXISTS idx_replies_parent_created
ON replies(parent_reply_id, created_at DESC)
WHERE parent_reply_id IS NOT NULL;

-- ============================================
-- VOTES TABLE INDEXES
-- ============================================

-- Check if user has voted (prevent duplicate votes)
CREATE INDEX IF NOT EXISTS idx_votes_user_reply
ON votes(user_id, reply_id);

-- Reply vote count aggregation
CREATE INDEX IF NOT EXISTS idx_votes_reply_type
ON votes(reply_id, vote_type);

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================

-- User's notifications (navbar + notifications page)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications(user_id, created_at DESC);

-- Unread notifications count (navbar badge)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = false;

-- Notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_user_type
ON notifications(user_id, type, created_at DESC);

-- ============================================
-- BOOKMARKS TABLE (if exists)
-- ============================================

-- User's bookmarks page
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
ON bookmarks(user_id, created_at DESC);

-- Check if topic is bookmarked by user
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_topic
ON bookmarks(user_id, topic_id);

-- ============================================
-- CATEGORIES TABLE INDEXES
-- ============================================

-- Slug lookup (unique)
CREATE INDEX IF NOT EXISTS idx_categories_slug
ON categories(slug);

-- ============================================
-- PASSWORD RESET TOKENS
-- ============================================

-- Token verification (used during password reset)
CREATE INDEX IF NOT EXISTS idx_password_reset_token_used
ON password_reset_tokens(token, used, expires_at)
WHERE used = false;

-- User's active tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_user_created
ON password_reset_tokens(user_id, created_at DESC);

-- ============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================

-- Forum homepage - fetch trending + pinned topics
CREATE INDEX IF NOT EXISTS idx_topics_homepage
ON topics(is_pinned DESC, created_at DESC, view_count DESC)
WHERE is_locked = false;

-- User activity aggregation (profile page stats)
CREATE INDEX IF NOT EXISTS idx_topics_author_count
ON topics(author_id)
WHERE is_locked = false;

CREATE INDEX IF NOT EXISTS idx_replies_author_count
ON replies(author_id);

-- ============================================
-- ANALYZE TABLES (Update statistics)
-- ============================================

ANALYZE profiles;
ANALYZE topics;
ANALYZE replies;
ANALYZE votes;
ANALYZE notifications;
ANALYZE categories;
ANALYZE bookmarks;
ANALYZE password_reset_tokens;

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'topics', 'replies', 'votes', 'notifications', 'bookmarks', 'categories')
ORDER BY tablename, indexname;
