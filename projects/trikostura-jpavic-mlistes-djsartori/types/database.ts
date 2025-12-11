export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'student' | 'admin'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          university: string | null
          study_program: string | null
          role: UserRole
          reputation: number
          created_at: string
          updated_at: string
          github_url: string | null
          linkedin_url: string | null
          website_url: string | null
          twitter_url: string | null
          year_of_study: number | null
          graduation_year: number | null
          courses: string | null
          academic_interests: string | null
          skills: string | null
          profile_color: string
          profile_banner_url: string | null
          email_verified: boolean
          email_verified_at: string | null
        }
        Insert: {
          id: string
          email: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          university?: string | null
          study_program?: string | null
          role?: UserRole
          reputation?: number
          created_at?: string
          updated_at?: string
          github_url?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          twitter_url?: string | null
          year_of_study?: number | null
          graduation_year?: number | null
          courses?: string | null
          academic_interests?: string | null
          skills?: string | null
          profile_color?: string
          profile_banner_url?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          university?: string | null
          study_program?: string | null
          role?: UserRole
          reputation?: number
          created_at?: string
          updated_at?: string
          github_url?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          twitter_url?: string | null
          year_of_study?: number | null
          graduation_year?: number | null
          courses?: string | null
          academic_interests?: string | null
          skills?: string | null
          profile_color?: string
          profile_banner_url?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          color: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          author_id: string
          category_id: string
          is_pinned: boolean
          is_locked: boolean
          view_count: number
          reply_count: number
          last_reply_at: string | null
          last_reply_by: string | null
          has_solution: boolean
          created_at: string
          updated_at: string
          edited_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: string
          author_id: string
          category_id: string
          is_pinned?: boolean
          is_locked?: boolean
          view_count?: number
          reply_count?: number
          last_reply_at?: string | null
          last_reply_by?: string | null
          has_solution?: boolean
          created_at?: string
          updated_at?: string
          edited_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string
          author_id?: string
          category_id?: string
          is_pinned?: boolean
          is_locked?: boolean
          view_count?: number
          reply_count?: number
          last_reply_at?: string | null
          last_reply_by?: string | null
          has_solution?: boolean
          created_at?: string
          updated_at?: string
          edited_at?: string | null
        }
      }
      replies: {
        Row: {
          id: string
          content: string
          author_id: string
          topic_id: string
          parent_reply_id: string | null
          is_solution: boolean
          upvotes: number
          downvotes: number
          created_at: string
          updated_at: string
          edited_at: string | null
        }
        Insert: {
          id?: string
          content: string
          author_id: string
          topic_id: string
          parent_reply_id?: string | null
          is_solution?: boolean
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
          edited_at?: string | null
        }
        Update: {
          id?: string
          content?: string
          author_id?: string
          topic_id?: string
          parent_reply_id?: string | null
          is_solution?: boolean
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
          edited_at?: string | null
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          reply_id: string
          vote_type: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reply_id: string
          vote_type: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reply_id?: string
          vote_type?: number
          created_at?: string
        }
      }
      topic_views: {
        Row: {
          id: string
          topic_id: string
          user_id: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          user_id?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          user_id?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      email_verification_tokens: {
        Row: {
          id: string
          user_id: string
          email: string
          token: string
          expires_at: string
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          token: string
          expires_at: string
          created_at?: string
          used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          token?: string
          expires_at?: string
          created_at?: string
          used_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
    }
  }
}

/**
 * Convenience type exports for easier use in components
 */
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];
export type Reply = Database['public']['Tables']['replies']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type TopicView = Database['public']['Tables']['topic_views']['Row'];

// Additional types for new features
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type ReportType = 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';

export interface Bookmark {
  id: string;
  user_id: string;
  topic_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  topic_id: string | null;
  reply_id: string | null;
  report_type: ReportType;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Extended types with relations
 */
export interface TopicWithAuthor extends Topic {
  author: Profile;
}

export interface TopicWithRelations extends Topic {
  author: Profile;
  category: Category;
}

export interface ReplyWithAuthor extends Reply {
  author: Profile;
}

export interface CategoryWithStats extends Category {
  topic_count?: number;
  last_post_at?: string | null;
}

/**
 * API response types
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}
