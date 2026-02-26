import type { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Link = Database['public']['Tables']['links']['Row'];
export type Cashflow = Database['public']['Tables']['cashflows']['Row'];
export type CashflowEntry =
  Database['public']['Tables']['cashflow_entries']['Row'];
export type CashflowShare =
  Database['public']['Tables']['cashflow_shares']['Row'];
export type SupportTicket =
  Database['public']['Tables']['support_tickets']['Row'];
export type SupportMessage =
  Database['public']['Tables']['support_messages']['Row'];

// UI / Domain Types
export type CashflowWithSummary =
  Database['public']['Views']['cashflow_summaries']['Row'] & {
    entries?: CashflowEntry[];
  };
