export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bio_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          profile_id: string
          source_url: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          profile_id: string
          source_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          profile_id?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_subscribers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_budgets: {
        Row: {
          amount: number
          cashflow_id: string
          category: string
          created_at: string | null
          id: string
          period: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          cashflow_id: string
          category: string
          created_at?: string | null
          id?: string
          period?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          cashflow_id?: string
          category?: string
          created_at?: string | null
          id?: string
          period?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_budgets_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflow_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_budgets_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflows"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_entries: {
        Row: {
          amount: number
          cashflow_id: string
          category: string | null
          created_at: string | null
          date: string
          description: string
          goal_id: string | null
          id: string
          is_recurring: boolean | null
          receipt_url: string | null
          recurrence_interval: string | null
          recurring_rule_id: string | null
          tags: string[]
          type: string
          yearly_calculation: string | null
        }
        Insert: {
          amount: number
          cashflow_id: string
          category?: string | null
          created_at?: string | null
          date?: string
          description: string
          goal_id?: string | null
          id?: string
          is_recurring?: boolean | null
          receipt_url?: string | null
          recurrence_interval?: string | null
          recurring_rule_id?: string | null
          tags?: string[]
          type: string
          yearly_calculation?: string | null
        }
        Update: {
          amount?: number
          cashflow_id?: string
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string
          goal_id?: string | null
          id?: string
          is_recurring?: boolean | null
          receipt_url?: string | null
          recurrence_interval?: string | null
          recurring_rule_id?: string | null
          tags?: string[]
          type?: string
          yearly_calculation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_entries_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflow_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_entries_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_entries_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "cashflow_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "cashflow_entries_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "cashflow_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_entries_recurring_rule_id_fkey"
            columns: ["recurring_rule_id"]
            isOneToOne: false
            referencedRelation: "cashflow_recurring_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_goals: {
        Row: {
          cashflow_id: string
          created_at: string | null
          deadline: string | null
          id: string
          is_deleted: boolean
          target_amount: number
          title: string
        }
        Insert: {
          cashflow_id: string
          created_at?: string | null
          deadline?: string | null
          id?: string
          is_deleted?: boolean
          target_amount: number
          title: string
        }
        Update: {
          cashflow_id?: string
          created_at?: string | null
          deadline?: string | null
          id?: string
          is_deleted?: boolean
          target_amount?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_goals_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflow_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_goals_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflows"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_recurring_rules: {
        Row: {
          amount: number
          cashflow_id: string
          category: string | null
          created_at: string | null
          day_of_month: number
          description: string
          goal_id: string | null
          id: string
          is_active: boolean
          recurrence_interval: string
          start_date: string
          type: string
          updated_at: string | null
          yearly_calculation: string | null
        }
        Insert: {
          amount: number
          cashflow_id: string
          category?: string | null
          created_at?: string | null
          day_of_month?: number
          description: string
          goal_id?: string | null
          id?: string
          is_active?: boolean
          recurrence_interval?: string
          start_date?: string
          type: string
          updated_at?: string | null
          yearly_calculation?: string | null
        }
        Update: {
          amount?: number
          cashflow_id?: string
          category?: string | null
          created_at?: string | null
          day_of_month?: number
          description?: string
          goal_id?: string | null
          id?: string
          is_active?: boolean
          recurrence_interval?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          yearly_calculation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_recurring_rules_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflow_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_recurring_rules_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_recurring_rules_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "cashflow_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "cashflow_recurring_rules_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "cashflow_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_shares: {
        Row: {
          cashflow_id: string
          created_at: string
          created_via_public_access: boolean | null
          email: string
          id: string
          is_included_in_totals: boolean | null
          is_pinned: boolean | null
          role: string
        }
        Insert: {
          cashflow_id: string
          created_at?: string
          created_via_public_access?: boolean | null
          email: string
          id?: string
          is_included_in_totals?: boolean | null
          is_pinned?: boolean | null
          role?: string
        }
        Update: {
          cashflow_id?: string
          created_at?: string
          created_via_public_access?: boolean | null
          email?: string
          id?: string
          is_included_in_totals?: boolean | null
          is_pinned?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_shares_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflow_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_shares_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflows"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_split_entries: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          id: string
          item_name: string
          parent_entry_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          id?: string
          item_name: string
          parent_entry_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          id?: string
          item_name?: string
          parent_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_split_entries_parent_entry_id_fkey"
            columns: ["parent_entry_id"]
            isOneToOne: false
            referencedRelation: "cashflow_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_tags: {
        Row: {
          cashflow_id: string
          color_index: number
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cashflow_id: string
          color_index?: number
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cashflow_id?: string
          color_index?: number
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_tags_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflow_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_tags_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflows"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflows: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean
          is_pinned: boolean
          is_public: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          is_public?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          is_public?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          profile_id: string
          status: string
          updated_at: string
          user_id: string
          verification_token: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          profile_id: string
          status?: string
          updated_at?: string
          user_id: string
          verification_token: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          profile_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number | null
          unit_price: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number | null
          unit_price?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string
          currency: string
          discount_amount: number | null
          due_date: string
          id: string
          include_client_signature: boolean
          include_issuer_signature: boolean
          invoice_number: string
          issue_date: string
          notes: string | null
          payment_info: string | null
          sender_address: string | null
          sender_email: string | null
          sender_name: string | null
          signatory_name: string | null
          signed_date: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          currency?: string
          discount_amount?: number | null
          due_date: string
          id?: string
          include_client_signature?: boolean
          include_issuer_signature?: boolean
          invoice_number: string
          issue_date?: string
          notes?: string | null
          payment_info?: string | null
          sender_address?: string | null
          sender_email?: string | null
          sender_name?: string | null
          signatory_name?: string | null
          signed_date?: string | null
          status: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          currency?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          include_client_signature?: boolean
          include_issuer_signature?: boolean
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          payment_info?: string | null
          sender_address?: string | null
          sender_email?: string | null
          sender_name?: string | null
          signatory_name?: string | null
          signed_date?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      link_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          link_id: string
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          link_id: string
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          link_id?: string
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_events_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          animation_type: string | null
          clicks: number | null
          created_at: string
          display_mode: string | null
          expires_at: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_folder: boolean | null
          is_header: boolean
          is_pinned: boolean
          is_sensitive: boolean
          last_clicked_at: string | null
          parent_id: string | null
          scheduled_at: string | null
          short_id: number | null
          sort_order: number | null
          title: string
          url: string
          user_id: string
        }
        Insert: {
          animation_type?: string | null
          clicks?: number | null
          created_at?: string
          display_mode?: string | null
          expires_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_folder?: boolean | null
          is_header?: boolean
          is_pinned?: boolean
          is_sensitive?: boolean
          last_clicked_at?: string | null
          parent_id?: string | null
          scheduled_at?: string | null
          short_id?: number | null
          sort_order?: number | null
          title: string
          url: string
          user_id: string
        }
        Update: {
          animation_type?: string | null
          clicks?: number | null
          created_at?: string
          display_mode?: string | null
          expires_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_folder?: boolean | null
          is_header?: boolean
          is_pinned?: boolean
          is_sensitive?: boolean
          last_clicked_at?: string | null
          parent_id?: string | null
          scheduled_at?: string | null
          short_id?: number | null
          sort_order?: number | null
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_columns: {
        Row: {
          created_at: string
          id: string
          is_done_column: boolean
          list_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_done_column?: boolean
          list_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_done_column?: boolean
          list_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_columns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "list_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_columns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          column_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          list_id: string
          metadata: Json | null
          priority: string | null
          recurrence_rule: string | null
          reminder_sent: boolean
          sort_order: number
          title: string
        }
        Insert: {
          column_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          list_id: string
          metadata?: Json | null
          priority?: string | null
          recurrence_rule?: string | null
          reminder_sent?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          column_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          list_id?: string
          metadata?: Json | null
          priority?: string | null
          recurrence_rule?: string | null
          reminder_sent?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "list_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "list_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_subtasks: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          item_id: string
          position: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          item_id: string
          position?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          item_id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_subtasks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "list_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          link_url: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          link_url?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          link_url?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          profile_id: string
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          profile_id: string
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          profile_id?: string
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          button_shape: string | null
          button_style: string | null
          created_at: string
          custom_theme: Json | null
          default_currency: string | null
          display_name: string | null
          has_completed_onboarding: boolean
          id: string
          lead_capture_enabled: boolean
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          role: string | null
          social_links: Json
          theme_name: string | null
          tier: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          button_shape?: string | null
          button_style?: string | null
          created_at?: string
          custom_theme?: Json | null
          default_currency?: string | null
          display_name?: string | null
          has_completed_onboarding?: boolean
          id: string
          lead_capture_enabled?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          role?: string | null
          social_links?: Json
          theme_name?: string | null
          tier?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          button_shape?: string | null
          button_style?: string | null
          created_at?: string
          custom_theme?: Json | null
          default_currency?: string | null
          display_name?: string | null
          has_completed_onboarding?: boolean
          id?: string
          lead_capture_enabled?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          role?: string | null
          social_links?: Json
          theme_name?: string | null
          tier?: string | null
          username?: string
        }
        Relationships: []
      }
      support_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          reader_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          reader_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          reader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_message_reads_reader_id_fkey"
            columns: ["reader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          last_bumped_at: string | null
          status: string | null
          subject: string
          urgency_score: number | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          last_bumped_at?: string | null
          status?: string | null
          subject: string
          urgency_score?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          last_bumped_at?: string | null
          status?: string | null
          subject?: string
          urgency_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance_rules: {
        Row: {
          category: string
          created_at: string | null
          id: string
          interval_distance: number | null
          interval_months: number | null
          is_active: boolean
          last_service_date: string | null
          last_service_odometer: number | null
          name: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          interval_distance?: number | null
          interval_months?: number | null
          is_active?: boolean
          last_service_date?: string | null
          last_service_odometer?: number | null
          name: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          interval_distance?: number | null
          interval_months?: number | null
          is_active?: boolean
          last_service_date?: string | null
          last_service_odometer?: number | null
          name?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_rules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_monthly_odometers: {
        Row: {
          id: string
          odometer: number
          updated_at: string | null
          user_id: string
          vehicle_id: string
          year_month: string
        }
        Insert: {
          id?: string
          odometer: number
          updated_at?: string | null
          user_id: string
          vehicle_id: string
          year_month: string
        }
        Update: {
          id?: string
          odometer?: number
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_monthly_odometers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          currency: string
          current_odometer: number
          estimated_monthly_km: number | null
          fuel_type: string
          id: string
          is_archived: boolean
          is_default: boolean
          license_plate: string | null
          name: string
          odometer_unit: string
          preferred_cashflow_id: string | null
          transmission: string
          type: string
          updated_at: string | null
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          current_odometer?: number
          estimated_monthly_km?: number | null
          fuel_type?: string
          id?: string
          is_archived?: boolean
          is_default?: boolean
          license_plate?: string | null
          name: string
          odometer_unit?: string
          preferred_cashflow_id?: string | null
          transmission?: string
          type?: string
          updated_at?: string | null
          user_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          current_odometer?: number
          estimated_monthly_km?: number | null
          fuel_type?: string
          id?: string
          is_archived?: boolean
          is_default?: boolean
          license_plate?: string | null
          name?: string
          odometer_unit?: string
          preferred_cashflow_id?: string | null
          transmission?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_preferred_cashflow_id_fkey"
            columns: ["preferred_cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflow_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_preferred_cashflow_id_fkey"
            columns: ["preferred_cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cashflow_goal_progress: {
        Row: {
          cashflow_id: string | null
          contribution_count: number | null
          goal_id: string | null
          saved_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_goals_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflow_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_goals_cashflow_id_fkey"
            columns: ["cashflow_id"]
            isOneToOne: false
            referencedRelation: "cashflows"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_summaries: {
        Row: {
          balance: number | null
          created_at: string | null
          entry_count: number | null
          expense: number | null
          id: string | null
          income: number | null
          is_archived: boolean | null
          is_pinned: boolean | null
          is_public: boolean | null
          last_entry_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_summaries: {
        Row: {
          completed_count: number | null
          created_at: string | null
          description: string | null
          id: string | null
          is_public: boolean | null
          item_count: number | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bump_support_ticket_urgency: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      create_support_ticket: {
        Args: { p_category: string; p_message: string; p_subject: string }
        Returns: string
      }
      get_analytics_by_country: {
        Args: {
          p_include_views?: boolean
          p_link_ids: string[]
          p_start_date?: string
        }
        Returns: {
          click_count: number
          country: string
          view_count: number
        }[]
      }
      get_analytics_chart_data: {
        Args: {
          p_bucket_interval?: string
          p_link_ids: string[]
          p_start_date?: string
        }
        Returns: {
          bucket: string
          click_count: number
        }[]
      }
      get_cashflow_chart_aggregates: {
        Args: { p_cashflow_ids: string[]; p_start_date?: string }
        Returns: {
          cashflow_id: string
          category: string
          month: string
          total_amount: number
          type: string
        }[]
      }
      get_dashboard_overview: {
        Args: { p_activity_limit?: number; p_user_id: string }
        Returns: Json
      }
      get_latest_recurring_templates: {
        Args: { p_cashflow_id: string }
        Returns: {
          amount: number
          cashflow_id: string
          category: string | null
          created_at: string | null
          date: string
          description: string
          goal_id: string | null
          id: string
          is_recurring: boolean | null
          receipt_url: string | null
          recurrence_interval: string | null
          recurring_rule_id: string | null
          tags: string[]
          type: string
          yearly_calculation: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "cashflow_entries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_link_click_trends: {
        Args: { p_user_id: string }
        Returns: {
          last_week: number
          link_id: string
          this_week: number
        }[]
      }
      get_next_short_id: { Args: { p_user_id: string }; Returns: number }
      get_recent_activity: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          context: string
          created_at: string
          title: string
          type: string
        }[]
      }
      get_support_ticket_queue: {
        Args: never
        Returns: {
          age_days: number
          avatar_url: string
          category: string
          created_at: string
          id: string
          last_bumped_at: string
          status: string
          subject: string
          total_urgency: number
          urgency_score: number
          user_id: string
          username: string
        }[]
      }
      get_top_links: {
        Args: { p_limit?: number; p_link_ids: string[]; p_start_date: string }
        Returns: {
          click_count: number
          link_id: string
        }[]
      }
      get_top_referers: {
        Args: { p_limit?: number; p_link_ids: string[]; p_start_date?: string }
        Returns: {
          click_count: number
          referer_domain: string
        }[]
      }
      increment_link_click: { Args: { link_id: string }; Returns: undefined }
      mark_support_messages_read: {
        Args: { p_ticket_id: string }
        Returns: number
      }
      reorder_links: { Args: { p_link_ids: string[] }; Returns: undefined }
      reorder_list_columns: {
        Args: { p_column_ids: string[] }
        Returns: undefined
      }
      reorder_list_items: { Args: { p_item_ids: string[] }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
