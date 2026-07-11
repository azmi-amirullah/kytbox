import type {
  Profile,
  Cashflow,
  CashflowEntry,
  CashflowShare,
  CashflowWithSummary,
  CashflowBudget,
  List,
  ListColumn,
  ListItem,
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
  CashflowDTO,
  CashflowEntryDTO,
  CashflowShareDTO,
  CashflowBudgetDTO,
  CashflowWithSummaryDTO,
  ListDTO,
  ListColumnDTO,
  ListItemDTO,
} from '@/types/dto';
import { listItemMetadataClientSchema } from '@/lib/validation.schemas.client';

export function mapProfileToDTO(row: Profile): ProfileDTO {
  return {
    id: row.id,
    username: row.username,
    full_name: row.display_name ?? null,
    bio: row.bio,
    avatar_url: row.avatar_url,
  };
}

export function mapLinkToDTO(row: {
  id: string;
  url?: string | null;
  title: string;
  is_active?: boolean | null;
  sort_order?: number | null;
  is_folder?: boolean | null;
  parent_id?: string | null;
  clicks?: number | null;
  animation_type?: string | null;
  children?: { count: number }[];
  child_count?: number | null;
}): LinkDTO {
  return {
    id: row.id,
    url: row.url || '#',
    title: row.title,
    is_active: !!row.is_active,
    sort_order: row.sort_order ?? 0,
    is_folder: !!row.is_folder,
    parent_id: row.parent_id ?? null,
    clicks: row.clicks ?? null,
    animation_type: row.animation_type ?? null,
    child_count: row.children?.[0]?.count ?? row.child_count ?? undefined,
  };
}

export function mapCashflowToDTO(row: Cashflow): CashflowDTO {
  return {
    id: row.id,
    title: row.title,
    is_public: !!row.is_public,
    user_id: row.user_id,
    created_at: row.created_at,
  };
}

export function mapCashflowEntryToDTO(row: CashflowEntry): CashflowEntryDTO {
  return {
    id: row.id,
    cashflow_id: row.cashflow_id,
    description: row.description,
    amount: row.amount,
    type: row.type,
    category: row.category,
    date: row.date,
    is_recurring: row.is_recurring ?? false,
    recurrence_interval: recurrenceIntervalSchema
      .catch(null)
      .parse(row.recurrence_interval),
    yearly_calculation: yearlyCalculationSchema
      .catch(null)
      .parse(row.yearly_calculation),
    created_at: row.created_at,
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
): CashflowWithSummaryDTO {
  return {
    id: row.id!,
    title: row.title!,
    is_public: !!row.is_public,
    user_id: row.user_id!,
    created_at: row.created_at,
    entryCount: Number(row.entry_count ?? 0),
    income: Number(row.income ?? 0),
    expense: Number(row.expense ?? 0),
    balance: Number(row.balance ?? 0),
    entries: row.entries?.map(mapCashflowEntryToDTO) ?? [],
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

export function mapListItemToDTO(row: ListItem): ListItemDTO {
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
  };
}
