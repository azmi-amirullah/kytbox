import type {
  Profile,
  Link,
  Cashflow,
  CashflowEntry,
  CashflowShare,
  CashflowWithSummary,
  CashflowBudget,
} from '@/types/database';
import { dtoShareRoleSchema, recurrenceIntervalSchema, yearlyCalculationSchema } from '@/lib/validation.schemas';

import type {
  ProfileDTO,
  LinkDTO,
  CashflowDTO,
  CashflowEntryDTO,
  CashflowShareDTO,
  CashflowBudgetDTO,
  CashflowWithSummaryDTO,
} from '@/types/dto';

export function mapProfileToDTO(row: Profile): ProfileDTO {
  return {
    id: row.id,
    username: row.username,
    full_name: row.display_name ?? null,
    bio: row.bio,
    avatar_url: row.avatar_url,
  };
}

export function mapLinkToDTO(
  row: Link & { children?: { count: number }[]; child_count?: number },
): LinkDTO {
  return {
    id: row.id,
    url: row.url || '#',
    title: row.title,
    is_active: !!row.is_active,
    sort_order: row.sort_order ?? 0,
    is_folder: !!row.is_folder,
    parent_id: row.parent_id,
    clicks: row.clicks,
    animation_type: row.animation_type,
    child_count: row.children?.[0]?.count ?? row.child_count,
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
