import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      team_members: {
        Row: {
          id: string;
          manager_id: string;
          full_name: string;
          email: string;
          role: string;
          photo_url: string | null;
          start_date: string;
          status: string;
          disc_d: number | null;
          disc_i: number | null;
          disc_s: number | null;
          disc_c: number | null;
          enneagram_primary: number | null;
          enneagram_wing: number | null;
          working_genius: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['team_members']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>;
      };
      performance_reviews: {
        Row: {
          id: string;
          team_member_id: string;
          manager_id: string;
          type: string;
          quarter: string | null;
          year: number | null;
          review_date: string;
          period_start: string | null;
          period_end: string | null;
          strengths: string | null;
          areas_for_improvement: string | null;
          goals: string | null;
          overall_rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['performance_reviews']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['performance_reviews']['Insert']>;
      };
      one_on_ones: {
        Row: {
          id: string;
          team_member_id: string;
          manager_id: string;
          meeting_date: string;
          notes: string | null;
          action_items: string | null;
          mood: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['one_on_ones']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['one_on_ones']['Insert']>;
      };
    };
  };
};
