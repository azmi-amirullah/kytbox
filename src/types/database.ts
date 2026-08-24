import type { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Link = Database['public']['Tables']['links']['Row'];
export type Cashflow = Database['public']['Tables']['cashflows']['Row'];
export type CashflowEntry =
  Database['public']['Tables']['cashflow_entries']['Row'];
export type CashflowSplitEntry =
  Database['public']['Tables']['cashflow_split_entries']['Row'];
export type CashflowShare =
  Database['public']['Tables']['cashflow_shares']['Row'];
export type CashflowBudget =
  Database['public']['Tables']['cashflow_budgets']['Row'];
export type CashflowTag =
  Database['public']['Tables']['cashflow_tags']['Row'];
export type CashflowGoal =
  Database['public']['Tables']['cashflow_goals']['Row'];
export type SupportTicket =
  Database['public']['Tables']['support_tickets']['Row'];
export type SupportMessage =
  Database['public']['Tables']['support_messages']['Row'];

// UI / Domain Types
export type CashflowWithSummary =
  Database['public']['Views']['cashflow_summaries']['Row'] & {
    entries?: CashflowEntry[];
  };

export type List = Database['public']['Tables']['lists']['Row'];
export type ListColumn = Database['public']['Tables']['list_columns']['Row'];
export type ListItem = Database['public']['Tables']['list_items']['Row'];
export type ListSubtask = Database['public']['Tables']['list_subtasks']['Row'];
export type ListWithSummary =
  Database['public']['Views']['list_summaries']['Row'];

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

