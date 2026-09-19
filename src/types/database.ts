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
export type CashflowRecurringRule =
  Database['public']['Tables']['cashflow_recurring_rules']['Row'];
export type CashflowSplitGroup =
  Database['public']['Tables']['cashflow_split_groups']['Row'];
export type CashflowSplitGroupExpense =
  Database['public']['Tables']['cashflow_split_group_expenses']['Row'];
export type CashflowAuditLog =
  Database['public']['Tables']['cashflow_audit_logs']['Row'];
export type SupportTicket =
  Database['public']['Tables']['support_tickets']['Row'];
export type SupportMessage =
  Database['public']['Tables']['support_messages']['Row'];
export type BioContactMessage =
  Database['public']['Tables']['bio_contact_messages']['Row'];

// UI / Domain Types
export type CashflowWithSummary =
  Database['public']['Views']['cashflow_summaries']['Row'] & {
    entries?: CashflowEntry[];
  };

export type List = Database['public']['Tables']['lists']['Row'];
export type ListColumn = Database['public']['Tables']['list_columns']['Row'];
export type ListItem = Database['public']['Tables']['list_items']['Row'];
export type ListSubtask = Database['public']['Tables']['list_subtasks']['Row'];
export type ListLabel = Database['public']['Tables']['list_labels']['Row'];
export type ListItemResource = Database['public']['Tables']['list_item_resources']['Row'];
export type ListWithSummary =
  Database['public']['Views']['list_summaries']['Row'];

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type VehicleMonthlyOdometer =
  Database['public']['Tables']['vehicle_monthly_odometers']['Row'];
export type VehicleMaintenanceRule =
  Database['public']['Tables']['vehicle_maintenance_rules']['Row'];
export type VehicleService =
  Database['public']['Tables']['vehicle_services']['Row'];
export type VehicleDocument =
  Database['public']['Tables']['vehicle_documents']['Row'];
export type DriverLicense =
  Database['public']['Tables']['driver_licenses']['Row'];
export type VehicleFuelLog =
  Database['public']['Tables']['vehicle_fuel_logs']['Row'];

