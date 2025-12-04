import { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];
export type Reply = Database['public']['Tables']['replies']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type TopicView = Database['public']['Tables']['topic_views']['Row'];

// Extended types with relations
export type TopicWithAuthor = Topic & {
  author: Profile;
  category: Category;
};

export type TopicWithDetails = TopicWithAuthor & {
  replies: ReplyWithAuthor[];
};

export type ReplyWithAuthor = Reply & {
  author: Profile;
  user_vote?: Vote;
};

export type CategoryWithTopicCount = Category & {
  topic_count: number;
  latest_topic?: Topic;
};
