// Data Transfer Objects (DTOs)
// Use these in Client Components instead of raw DB types defined in database.ts
// This prevents Component Data Leaks where sensitive DB fields or pure server metadata
// are accidentally passed down to the client bundle.

// We specifically omit fields that a client component should almost never see
// or don't need to know about (raw ids without context, internal timestamps when not displayed, etc)
// If you need more fields, add them explicitly here instead of passing the raw Row type.

export interface ProfileDTO {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  lead_capture_enabled?: boolean
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
}

export interface LinkDTO {
  id: string
  url: string
  title: string
  is_active: boolean
  sort_order: number
  is_folder: boolean
  is_header: boolean
  parent_id: string | null
  clicks: number | null
  animation_type: string | null
  display_mode?: string | null
  icon_url?: string | null
  scheduled_at: string | null
  expires_at: string | null
  child_count?: number
  is_local?: boolean
  is_pinned?: boolean
  is_sensitive?: boolean
}

export interface BioSubscriberDTO {
  id: string
  profile_id: string
  email: string
  source_url: string | null
  created_at: string
}

export interface CustomDomainDTO {
  id: string
  user_id: string
  profile_id: string
  domain: string
  status: 'pending' | 'verified'
  verification_token: string
  created_at: string
  updated_at: string
}

export interface CashflowDTO {
  id: string
  title: string
  is_public: boolean
  user_id: string
  created_at: string | null
}

export interface CashflowSplitEntryDTO {
  id: string
  parent_entry_id: string
  item_name: string
  category: string | null
  amount: number
  created_at?: string | null
}

export interface CashflowEntryDTO {
  id: string
  cashflow_id: string
  goal_id: string | null
  description: string
  amount: number
  type: string
  category: string | null
  date: string
  created_at: string | null
  is_recurring: boolean
  recurrence_interval: 'monthly' | 'yearly' | null
  yearly_calculation: 'prorated' | 'exact' | null
  tags: string[]
  items?: CashflowSplitEntryDTO[]
  receipt_url?: string | null
}

export interface CashflowShareDTO {
  id: string
  cashflow_id: string
  role: 'viewer' | 'editor'
  email: string
}

export interface CashflowBudgetDTO {
  id: string
  cashflow_id: string
  category: string
  amount: number
  period: 'monthly'
}

export interface CashflowTagDTO {
  id: string
  cashflow_id: string
  name: string
  color_index: number
  created_at: string | null
}

export interface CashflowGoalDTO {
  id: string
  cashflow_id: string
  cashflow_title: string | null
  title: string
  target_amount: number
  saved_amount: number
  contribution_count: number
  deadline: string | null
  created_at: string | null
}

export interface CashflowChartAggregateDTO {
  cashflow_id: string
  month: string
  type: 'income' | 'expense'
  category: string
  total_amount: number
}

export interface CashflowWithSummaryDTO extends CashflowDTO {
  entries?: CashflowEntryDTO[]
  entryCount: number
  income: number
  expense: number
  balance: number
  isIncluded?: boolean
}


// ==========================================
// LIST APP DTOs
// ==========================================

export type ListType = 'todo' | 'wishlist' | 'idea'

export interface ListDTO {
  id: string
  title: string
  description: string | null
  type: ListType
  is_public: boolean
  user_id: string
  created_at: string | null
  updated_at: string | null
  item_count: number
  completed_count: number
}

export interface ListColumnDTO {
  id: string
  list_id: string
  title: string
  sort_order: number
  is_done_column: boolean
}

export interface ListSubtaskDTO {
  id: string
  item_id: string
  title: string
  is_completed: boolean
  position: number
  created_at: string | null
}

export interface ListItemDTO {
  id: string
  list_id: string
  column_id: string | null
  title: string
  description: string | null
  is_completed: boolean
  sort_order: number
  metadata: Record<string, unknown>
  created_at: string | null
  due_date: string | null
  reminder_sent?: boolean
  subtasks?: ListSubtaskDTO[]
}

export interface WishlistItemMeta {
  price: number | null
  currency: string | null
  purchase_url: string | null
}
