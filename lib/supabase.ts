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
          role: 'citizen' | 'deputy' | 'admin'
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Report = Database['public']['Tables']['reports']['Row']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']
export type User = Database['public']['Tables']['users']['Row']

