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
          created_at: string
          updated_at: string
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
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
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
