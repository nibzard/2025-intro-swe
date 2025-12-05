// =====================================================
// USER PROFILE ENHANCEMENTS
// =====================================================

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  social_links?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  location?: string;
  website?: string;
  reputation: number;
  role: 'user' | 'moderator' | 'admin';
  total_posts: number;
  total_replies: number;
  streak_days: number;
  last_active_date?: string;
  created_at: string;
}

export interface SavedTopic {
  id: string;
  user_id: string;
  topic_id: string;
  created_at: string;
}

// =====================================================
// SUBSCRIPTIONS & NOTIFICATIONS
// =====================================================

export interface TopicSubscription {
  id: string;
  user_id: string;
  topic_id: string;
  notify_email: boolean;
  notify_app: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_replies: boolean;
  email_mentions: boolean;
  email_subscriptions: boolean;
  email_digest: boolean;
  email_digest_frequency: 'daily' | 'weekly' | 'monthly';
  app_replies: boolean;
  app_mentions: boolean;
  app_subscriptions: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// GAMIFICATION
// =====================================================

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: string;
  requirement_value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_value: number;
  metadata: Record<string, any>;
  created_at: string;
}

// =====================================================
// SOCIAL FEATURES
// =====================================================

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  sender?: {
    username: string;
    avatar_url?: string;
  };
  recipient?: {
    username: string;
    avatar_url?: string;
  };
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  reply_id?: string;
  topic_id?: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'helpful' | 'insightful';
  created_at: string;
}

// =====================================================
// MODERATION
// =====================================================

export interface Report {
  id: string;
  reporter_id?: string;
  reported_user_id?: string;
  topic_id?: string;
  reply_id?: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface UserWarning {
  id: string;
  user_id: string;
  issued_by?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface UserBan {
  id: string;
  user_id: string;
  banned_by?: string;
  reason: string;
  ban_type: 'temporary' | 'permanent';
  expires_at?: string;
  created_at: string;
  is_active: boolean;
}

// =====================================================
// TOPIC FEATURES
// =====================================================

export interface Poll {
  id: string;
  topic_id: string;
  question: string;
  options: PollOption[];
  multiple_choice: boolean;
  closes_at?: string;
  created_at: string;
}

export interface PollOption {
  text: string;
  votes: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export interface TopicTemplate {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  template_content: string;
  is_active: boolean;
  created_at: string;
}

// =====================================================
// ANALYTICS
// =====================================================

export interface TopicView {
  id: string;
  topic_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UserStats {
  total_topics: number;
  total_replies: number;
  total_upvotes: number;
  total_solutions: number;
  reputation: number;
  badges_earned: number;
  followers: number;
  following: number;
  streak_days: number;
}

export interface TopicAnalytics {
  views_total: number;
  views_today: number;
  views_this_week: number;
  views_this_month: number;
  reply_count: number;
  average_response_time: number;
  engagement_rate: number;
}
