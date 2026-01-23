export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DateRange = '24h' | '7d' | '30d' | 'lifetime';

export interface Database {
  public: {
    Tables: {
      link_events: {
        Row: {
          id: string;
          link_id: string;
          created_at: string;
          user_agent: string | null;
          country: string | null;
          city: string | null;
          referer: string | null;
        };
        Insert: {
          id?: string;
          link_id: string;
          created_at?: string;
          user_agent?: string | null;
          country?: string | null;
          city?: string | null;
          referer?: string | null;
        };
        Update: {
          id?: string;
          link_id?: string;
          created_at?: string;
          user_agent?: string | null;
          country?: string | null;
          city?: string | null;
          referer?: string | null;
        };
      };
      // ... existing tables
    };
  };
}
