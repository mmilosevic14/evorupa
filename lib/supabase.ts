import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

// Re-export the client creation functions
export { createServerClient, createBrowserClient }

// Database types - Update these based on your Supabase schema
export type Database = {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: string
          latitude: number
          longitude: number
          photo_url: string | null
          status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
          priority: string | null
          tags: string[] | null
          upvotes: number | null
          views: number | null
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
      report_categories: {
        Row: {
          code: string
          label_sr: string
          description: string | null
          sort_order: number
        }
        Insert: Database['public']['Tables']['report_categories']['Row']
        Update: Partial<Database['public']['Tables']['report_categories']['Insert']>
      }
      report_statuses: {
        Row: {
          code: 'pending' | 'in_progress' | 'resolved' | 'rejected'
          label_sr: string
          description: string | null
          sort_order: number
        }
        Insert: Database['public']['Tables']['report_statuses']['Row']
        Update: Partial<Database['public']['Tables']['report_statuses']['Insert']>
      }
      report_upvotes: {
        Row: {
          report_id: string
          user_id: string
          created_at: string
        }
        Insert: Database['public']['Tables']['report_upvotes']['Row']
        Update: Partial<Database['public']['Tables']['report_upvotes']['Insert']>
      }
      settlements: {
        Row: {
          id: string
          name: string
          municipality: string
          district: string | null
          region: string
          place_type: string
          latitude: number
          longitude: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['settlements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['settlements']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'citizen' | 'deputy' | 'admin'
          is_public: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
    }
    Views: {}
    Functions: {
      increment_report_views: {
        Args: {
          report_ids: string[]
        }
        Returns: undefined
      }
      toggle_report_upvote: {
        Args: {
          p_report_id: string
        }
        Returns: {
          has_upvoted: boolean
          priority: string
          upvotes: number
        }[]
      }
    }
    Enums: {}
  }
}

export type Report = Database['public']['Tables']['reports']['Row']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']
export type User = Database['public']['Tables']['users']['Row']

