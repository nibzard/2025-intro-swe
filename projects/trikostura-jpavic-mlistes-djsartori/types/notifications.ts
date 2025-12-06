export type NotificationType =
  | 'reply_to_topic'
  | 'reply_to_reply'
  | 'upvote'
  | 'topic_pinned'
  | 'topic_locked'
  | 'mention';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  actor_id: string | null;
  topic_id: string | null;
  reply_id: string | null;
  created_at: string;
  actor?: {
    username: string;
    avatar_url: string | null;
  };
}
