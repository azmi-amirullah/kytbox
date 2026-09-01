import type {
  Profile,
  Cashflow,
  CashflowSplitEntry,
  CashflowShare,
  CashflowWithSummary,
  CashflowBudget,
  CashflowTag,
  CashflowGoal,
  List,
  ListColumn,
  ListItem,
  ListSubtask,
  ListWithSummary,
} from '@/types/database';
import {
  dtoShareRoleSchema,
  recurrenceIntervalSchema,
  yearlyCalculationSchema,
  listTypeSchema,
} from '@/lib/validation.schemas';

import type {
  ProfileDTO,
  LinkDTO,
  BioSubscriberDTO,
  CustomDomainDTO,
  CashflowDTO,
  CashflowEntryDTO,
  CashflowSplitEntryDTO,
  CashflowShareDTO,
  CashflowBudgetDTO,
  CashflowTagDTO,
  CashflowGoalDTO,
  CashflowRecurringRuleDTO,
  CashflowWithSummaryDTO,
  ListDTO,
  ListColumnDTO,
  ListItemDTO,
  ListSubtaskDTO,
} from '@/types/dto';
import {
  listItemMetadataClientSchema,
  listItemPriorityClientSchema,
  listItemRecurrenceClientSchema,
} from '@/lib/validation.schemas.client';

export function mapProfileToDTO(row: Profile): ProfileDTO {
  return {
    id: row.id,
    username: row.username,
    full_name: row.display_name ?? null,
    bio: row.bio,
    avatar_url: row.avatar_url,
    lead_capture_enabled: row.lead_capture_enabled ?? true,
    meta_title: row.meta_title ?? null,
    meta_description: row.meta_description ?? null,
    og_image_url: row.og_image_url ?? null,
  };
}

export function mapLinkToDTO(row: {
  id: string;
  url?: string | null;
  title: string;
  is_active?: boolean | null;
  sort_order?: number | null;
  is_folder?: boolean | null;
  is_header?: boolean | null;
  parent_id?: string | null;
  clicks?: number | null;
  animation_type?: string | null;
  display_mode?: string | null;
  icon_url?: string | null;
  scheduled_at?: string | null;
  expires_at?: string | null;
  children?: { count: number }[];
  child_count?: number | null;
  is_pinned?: boolean | null;
  is_sensitive?: boolean | null;
}): LinkDTO {
  return {
    id: row.id,
    url: row.url || '#',
    title: row.title,
    is_active: !!row.is_active,
    sort_order: row.sort_order ?? 0,
    is_folder: !!row.is_folder,
    is_header: !!row.is_header,
    parent_id: row.parent_id ?? null,
    clicks: row.clicks ?? null,
    animation_type: row.animation_type ?? null,
    display_mode: row.display_mode ?? 'link',
    icon_url: row.icon_url ?? null,
    scheduled_at: row.scheduled_at ?? null,
    expires_at: row.expires_at ?? null,
    child_count: row.children?.[0]?.count ?? row.child_count ?? undefined,
    is_pinned: row.is_pinned ?? false,
    is_sensitive: row.is_sensitive ?? false,
  };
}

export function mapSubscriberToDTO(row: {
  id: string;
  profile_id: string;
  email: string;
  source_url?: string | null;
  created_at: string;
}): BioSubscriberDTO {
  return {
    id: row.id,
    profile_id: row.profile_id,
    email: row.email,
    source_url: row.source_url ?? null,
    created_at: row.created_at,
  };
}

export function mapCustomDomainToDTO(row: {
  id: string;
  user_id: string;
  profile_id: string;
  domain: string;
  status: string;
  verification_token: string;
  created_at: string;
  updated_at: string;
}): CustomDomainDTO {
  return {
    id: row.id,
    user_id: row.user_id,
    profile_id: row.profile_id,
    domain: row.domain,
    status: row.status === 'verified' ? 'verified' : 'pending',
    verification_token: row.verification_token,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapCashflowToDTO(row: Cashflow): CashflowDTO {
  return {
    id: row.id,
    title: row.title,
    is_public: !!row.is_public,
    user_id: row.user_id,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    is_pinned: row.is_pinned ?? false,
    is_archived: row.is_archived ?? false,
  };
}

export function mapCashflowSplitEntryToDTO(
  row: CashflowSplitEntry,
): CashflowSplitEntryDTO {
  return {
    id: row.id,
    parent_entry_id: row.parent_entry_id,
    item_name: row.item_name,
    category: row.category ?? null,
    amount: row.amount,
    created_at: row.created_at,
  };
}

export function mapCashflowEntryToDTO(
  row: {
    id: string;
    cashflow_id: string;
    description: string;
    amount: number;
    type: string;
    date: string;
    goal_id?: string | null;
    category?: string | null;
    is_recurring?: boolean | null;
    recurring_rule_id?: string | null;
    recurrence_interval?: string | null;
    yearly_calculation?: string | null;
    created_at?: string | null;
    tags?: string[] | null;
    receipt_url?: string | null;
    cashflow_split_entries?: CashflowSplitEntry[];
  },
  goalTitle?: string | null,
): CashflowEntryDTO {
  const category = row.goal_id
    ? goalTitle
      ? `Goal: ${goalTitle}`
      : null
    : row.category?.startsWith('Goal:')
      ? null
      : row.category;

  const items = Array.isArray(row.cashflow_split_entries) && row.cashflow_split_entries.length > 0
    ? row.cashflow_split_entries.map(mapCashflowSplitEntryToDTO)
    : undefined;

  return {
    id: row.id,
    cashflow_id: row.cashflow_id,
    goal_id: row.goal_id ?? null,
    description: row.description,
    amount: row.amount,
    type: row.type,
    category: category ?? null,
    date: row.date,
    is_recurring: row.is_recurring ?? false,
    recurring_rule_id: row.recurring_rule_id ?? null,
    recurrence_interval: recurrenceIntervalSchema
      .catch(null)
      .parse(row.recurrence_interval),
    yearly_calculation: yearlyCalculationSchema
      .catch(null)
      .parse(row.yearly_calculation),
    created_at: row.created_at ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    items,
    receipt_url: row.receipt_url ?? null,
  };
}

export function mapCashflowRecurringRuleToDTO(
  row: {
    id: string;
    cashflow_id: string;
    description: string;
    amount: number;
    type: string;
    category?: string | null;
    goal_id?: string | null;
    recurrence_interval?: string | null;
    yearly_calculation?: string | null;
    day_of_month?: number | null;
    is_active?: boolean | null;
    start_date: string;
    created_at?: string | null;
    updated_at?: string | null;
  },
  goalTitle?: string | null,
): CashflowRecurringRuleDTO {
  const category = row.goal_id
    ? goalTitle
      ? `Goal: ${goalTitle}`
      : null
    : row.category?.startsWith('Goal:')
      ? null
      : row.category;

  return {
    id: row.id,
    cashflow_id: row.cashflow_id,
    description: row.description,
    amount: row.amount,
    type: row.type === 'income' ? 'income' : 'expense',
    category: category ?? null,
    goal_id: row.goal_id ?? null,
    recurrence_interval: row.recurrence_interval === 'yearly' ? 'yearly' : 'monthly',
    yearly_calculation: row.yearly_calculation === 'exact' ? 'exact' : row.yearly_calculation === 'prorated' ? 'prorated' : null,
    day_of_month: row.day_of_month || 1,
    is_active: row.is_active ?? true,
    start_date: row.start_date,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

export function mapCashflowShareToDTO(row: CashflowShare): CashflowShareDTO {
  return {
    id: row.id,
    cashflow_id: row.cashflow_id,
    role: dtoShareRoleSchema.parse(row.role),
    email: row.email,
  };
}

export function mapCashflowWithSummaryToDTO(
  row: CashflowWithSummary,
  goalTitles?: ReadonlyMap<string, string>,
): CashflowWithSummaryDTO {
  const lastActivityAt = row.last_entry_at || row.updated_at || row.created_at || null;
  return {
    id: row.id!,
    title: row.title!,
    is_public: !!row.is_public,
    user_id: row.user_id!,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    is_pinned: row.is_pinned ?? false,
    is_archived: row.is_archived ?? false,
    last_entry_at: row.last_entry_at ?? null,
    lastActivityAt,
    entryCount: Number(row.entry_count ?? 0),
    income: Number(row.income ?? 0),
    expense: Number(row.expense ?? 0),
    balance: Number(row.balance ?? 0),
    entries: row.entries
      ? row.entries.map((entry) =>
          mapCashflowEntryToDTO(
            entry,
            entry.goal_id ? goalTitles?.get(entry.goal_id) ?? null : undefined,
          ),
        )
      : [],
  };
}

export function mapBudgetToDTO(row: CashflowBudget): CashflowBudgetDTO {
  return {
    id: row.id,
    cashflow_id: row.cashflow_id,
    category: row.category,
    amount: Number(row.amount),
    period: 'monthly',
  };
}

export function mapTagToDTO(row: CashflowTag): CashflowTagDTO {
  return {
    id: row.id,
    cashflow_id: row.cashflow_id,
    name: row.name,
    color_index: row.color_index,
    created_at: row.created_at,
  };
}

export function mapGoalToDTO(
  row: CashflowGoal,
  cashflowTitle: string | null = null,
  savedAmount = 0,
  contributionCount = 0,
): CashflowGoalDTO {
  return {
    id: row.id,
    cashflow_id: row.cashflow_id,
    cashflow_title: cashflowTitle,
    title: row.title,
    target_amount: Number(row.target_amount),
    saved_amount: Math.max(0, Number(savedAmount)),
    contribution_count: Math.max(0, Number(contributionCount)),
    deadline: row.deadline ?? null,
    created_at: row.created_at,
    is_archived: Boolean(row.is_deleted),
  };
}

export function mapListToDTO(row: List): ListDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: listTypeSchema.catch('todo').parse(row.type),
    is_public: row.is_public,
    user_id: row.user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    item_count: 0,
    completed_count: 0,
  };
}

export function mapListWithSummaryToDTO(row: ListWithSummary): ListDTO {
  return {
    id: row.id!,
    title: row.title!,
    description: row.description,
    type: listTypeSchema.catch('todo').parse(row.type),
    is_public: !!row.is_public,
    user_id: row.user_id!,
    created_at: row.created_at,
    updated_at: row.updated_at,
    item_count: row.item_count ?? 0,
    completed_count: row.completed_count ?? 0,
  };
}

export function mapListColumnToDTO(row: ListColumn): ListColumnDTO {
  return {
    id: row.id,
    list_id: row.list_id,
    title: row.title,
    sort_order: row.sort_order,
    is_done_column: row.is_done_column,
  };
}

export function mapListSubtaskToDTO(row: ListSubtask): ListSubtaskDTO {
  return {
    id: row.id,
    item_id: row.item_id,
    title: row.title,
    is_completed: row.is_completed,
    position: row.position,
    created_at: row.created_at,
  };
}

export function mapListItemToDTO(
  row: ListItem & { list_subtasks?: ListSubtask[] },
): ListItemDTO {
  const subtasks = Array.isArray(row.list_subtasks) && row.list_subtasks.length > 0
    ? row.list_subtasks
        .map(mapListSubtaskToDTO)
        .sort((a, b) => a.position - b.position || (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    : undefined;

  return {
    id: row.id,
    list_id: row.list_id,
    column_id: row.column_id,
    title: row.title,
    description: row.description,
    is_completed: row.is_completed,
    sort_order: row.sort_order,
    metadata: listItemMetadataClientSchema.parse(row.metadata),
    created_at: row.created_at,
    due_date: row.due_date ?? null,
    reminder_sent: row.reminder_sent ?? false,
    priority: listItemPriorityClientSchema.parse(row.priority),
    recurrence_rule: listItemRecurrenceClientSchema.parse(row.recurrence_rule),
    subtasks,
  };
}
