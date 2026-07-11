import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import {
  mapCashflowWithSummaryToDTO,
  mapCashflowToDTO,
  mapCashflowEntryToDTO,
  mapBudgetToDTO,
} from '@/lib/mappers';
import type { CashflowEntry } from '@/types/database';
import type {
  CashflowDTO,
  CashflowEntryDTO,
  CashflowBudgetDTO,
  CashflowWithSummaryDTO,
} from '@/types/dto';

export interface CashflowSummariesResult {
  cashflows: (CashflowWithSummaryDTO & { isIncluded: boolean })[];
  defaultCurrency: string | null;
}

export interface CashflowDetailResult {
  cashflow: CashflowDTO;
  entries: CashflowEntryDTO[];
  budgets: CashflowBudgetDTO[];
}

/**
 * Fetch cashflow summaries for the user dashboard
 */
export async function getCashflowDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string
): Promise<CashflowSummariesResult> {
  // Parallelize profile and shares queries
  const [profileResult, sharesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('default_currency')
      .eq('id', userId)
      .single(),
    supabase
      .from('cashflow_shares')
      .select('cashflow_id, is_included_in_totals')
      .eq('email', email.toLowerCase())
      .eq('is_pinned', true),
  ]);

  const profile = profileResult.data;
  const shares = sharesResult.data;

  if (!profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  const includedShareIds = new Set(
    shares?.filter((s) => s.is_included_in_totals).map((s) => s.cashflow_id) || [],
  );

  const allShareIds = shares?.map((s) => s.cashflow_id) || [];

  // Get user's cashflow summaries from the view
  let query = supabase
    .from('cashflow_summaries')
    .select('id, user_id, title, created_at, is_public, entry_count, income, expense, balance')
    .order('created_at', { ascending: false });

  if (allShareIds.length > 0) {
    query = query.or(`user_id.eq.${userId},id.in.(${allShareIds.join(',')})`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data: cashflowSummariesData } = await query;
  const summaryIds: string[] = (cashflowSummariesData || [])
    .map((c) => c.id)
    .filter((id): id is string => Boolean(id));

  // Fetch entries for charts
  let entriesData: CashflowEntry[] = [];

  if (summaryIds.length > 0) {
    const { data } = await supabase
      .from('cashflow_entries')
      .select(
        'id, cashflow_id, amount, type, category, date, description, is_recurring, recurrence_interval, yearly_calculation, created_at'
      )
      .in('cashflow_id', summaryIds)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });
    entriesData = data ?? [];
  }

  // Group entries by cashflow_id
  const entriesByCashflow = new Map<string, CashflowEntry[]>();
  for (const entry of entriesData) {
    const existing = entriesByCashflow.get(entry.cashflow_id) || [];
    existing.push(entry);
    entriesByCashflow.set(entry.cashflow_id, existing);
  }

  const cashflows = (cashflowSummariesData || []).map((c) => {
    const entries = entriesByCashflow.get(c.id || '') || [];
    const dto = mapCashflowWithSummaryToDTO({
      ...c,
      entries,
    });
    return {
      ...dto,
      isIncluded: c.user_id === userId || (!!c.id && includedShareIds.has(c.id)),
    };
  });

  return {
    cashflows,
    defaultCurrency: profile.default_currency,
  };
}

/**
 * Fetch a cashflow detail including entries and budgets
 */
export async function getCashflowDetailData(
  supabase: SupabaseClient<Database>,
  cashflowId: string,
  userId: string | undefined,
  userEmail: string | undefined,
  isOwner: boolean
): Promise<CashflowDetailResult & {
  profile: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
    role: string | null;
    default_currency: string | null;
  } | null;
  share: { id: string; role: string; is_pinned: boolean | null } | null;
  budgetsResultData: Database['public']['Tables']['cashflow_budgets']['Row'][] | null;
}> {
  // Parallelize: profile, cashflow, entries, share, budgets
  const [profileResult, cashflowResult, entriesResult, shareResult, budgetsResult] =
    await Promise.all([
      userId
        ? supabase
            .from('profiles')
            .select('username, avatar_url, display_name, role, default_currency')
            .eq('id', userId)
            .single()
        : Promise.resolve({ data: null }),
      supabase.from('cashflows').select('*').eq('id', cashflowId).single(),
      supabase
        .from('cashflow_entries')
        .select('*')
        .eq('cashflow_id', cashflowId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      userEmail
        ? supabase
            .from('cashflow_shares')
            .select('id, role, is_pinned')
            .eq('cashflow_id', cashflowId)
            .eq('email', userEmail.toLowerCase())
            .maybeSingle()
        : Promise.resolve({ data: null }),
      userId
        ? supabase
            .from('cashflow_budgets')
            .select('*')
            .eq('cashflow_id', cashflowId)
            .order('category', { ascending: true })
        : Promise.resolve({ data: null }),
    ]);

  const cashflow = cashflowResult.data;
  if (!cashflow) {
    throw new Error('CASHFLOW_NOT_FOUND');
  }

  const entries = (entriesResult.data ?? []).map(mapCashflowEntryToDTO);

  // Only map budgets if the user is the owner (budgets are owner-only)
  const budgets = isOwner && budgetsResult?.data
    ? budgetsResult.data.map(mapBudgetToDTO)
    : [];

  return {
    cashflow: mapCashflowToDTO(cashflow),
    entries,
    budgets,
    profile: profileResult.data,
    share: shareResult.data,
    budgetsResultData: budgetsResult?.data,
  };
}
