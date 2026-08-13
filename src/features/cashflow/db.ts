import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getAccessibleCashflows } from './access';
import {
  mapCashflowWithSummaryToDTO,
  mapCashflowToDTO,
  mapCashflowEntryToDTO,
  mapBudgetToDTO,
  mapGoalToDTO,
} from '@/lib/mappers';
import type { CashflowEntry } from '@/types/database';
import type {
  CashflowDTO,
  CashflowEntryDTO,
  CashflowBudgetDTO,
  CashflowGoalDTO,
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
  goals: CashflowGoalDTO[];
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
      .eq('email', email.trim().toLowerCase())
      .eq('is_pinned', true),
  ]);

  const profile = profileResult.data;
  const shares = sharesResult.data;

  if (profileResult.error || sharesResult.error) {
    console.error('cashflow_dashboard_base_lookup_failed', {
      profile: profileResult.error,
      shares: sharesResult.error,
    });
    throw new Error('CASHFLOW_DASHBOARD_LOOKUP_FAILED');
  }

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

  const { data: cashflowSummariesData, error: cashflowSummariesError } =
    await query;
  if (cashflowSummariesError) {
    console.error('cashflow_dashboard_summary_lookup_failed', cashflowSummariesError);
    throw new Error('CASHFLOW_DASHBOARD_LOOKUP_FAILED');
  }
  const summaryIds: string[] = (cashflowSummariesData || [])
    .map((c) => c.id)
    .filter((id): id is string => Boolean(id));
  // Fetch entries for dashboard charts
  const entriesData: CashflowEntry[] = [];
  const dashboardGoalTitles = new Map<string, string>();

  if (summaryIds.length > 0) {
    const { data, error } = await supabase
      .from('cashflow_entries')
      .select(
        'id, cashflow_id, goal_id, amount, type, category, date, description, is_recurring, recurrence_interval, yearly_calculation, created_at, cashflow_goals(id, title)'
      )
      .in('cashflow_id', summaryIds)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1000);
    if (error) {
      console.error('cashflow_dashboard_entry_lookup_failed', error);
      throw new Error('CASHFLOW_DASHBOARD_LOOKUP_FAILED');
    }
    if (data) {
      for (const row of data) {
        entriesData.push(row);
        if (
          'cashflow_goals' in row &&
          row.cashflow_goals &&
          typeof row.cashflow_goals === 'object' &&
          'id' in row.cashflow_goals &&
          'title' in row.cashflow_goals &&
          typeof row.cashflow_goals.id === 'string' &&
          typeof row.cashflow_goals.title === 'string'
        ) {
          dashboardGoalTitles.set(row.cashflow_goals.id, row.cashflow_goals.title);
        }
      }
    }
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
    }, dashboardGoalTitles);
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
  // Goal pickers include every owned or explicitly shared book visible to the
  // current user, not just the book currently being viewed.
  let queryIds: string[] = [cashflowId];
  const cashflowTitles = new Map<string, string>();
  if (userId) {
    const accessibleCashflows = await getAccessibleCashflows(
      supabase,
      userId,
      userEmail,
      cashflowId,
    );
    for (const accessibleCashflow of accessibleCashflows) {
      cashflowTitles.set(accessibleCashflow.id, accessibleCashflow.title);
    }
    queryIds = Array.from(
      new Set([cashflowId, ...accessibleCashflows.map((c) => c.id)]),
    );
  }

  // Parallelize: profile, cashflow, entries, share, budgets, goals, contributions
  const [
    profileResult,
    cashflowResult,
    entriesResult,
    shareResult,
    budgetsResult,
    goalsResult,
    goalProgressResult,
  ] = await Promise.all([
      userId
        ? supabase
            .from('profiles')
            .select('username, avatar_url, display_name, role, default_currency')
            .eq('id', userId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      supabase.from('cashflows').select('*').eq('id', cashflowId).single(),
      supabase
        .from('cashflow_entries')
        .select('*, cashflow_split_entries(*)')
        .eq('cashflow_id', cashflowId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000),
      userEmail
        ? supabase
            .from('cashflow_shares')
            .select('id, role, is_pinned')
            .eq('cashflow_id', cashflowId)
            .eq('email', userEmail.trim().toLowerCase())
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      userId
        ? supabase
            .from('cashflow_budgets')
            .select('*')
            .eq('cashflow_id', cashflowId)
            .order('category', { ascending: true })
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('cashflow_goals')
        .select('*')
        .in('cashflow_id', queryIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('cashflow_goal_progress')
        .select('cashflow_id, goal_id, saved_amount, contribution_count')
        .in('cashflow_id', queryIds),
  ]);

  if (cashflowResult.error) {
    if (cashflowResult.error.code === 'PGRST116') {
      throw new Error('CASHFLOW_NOT_FOUND');
    }
    console.error('cashflow_detail_base_lookup_failed', cashflowResult.error);
    throw new Error('CASHFLOW_DETAIL_LOOKUP_FAILED');
  }

  const cashflow = cashflowResult.data;
  if (!cashflow) {
    throw new Error('CASHFLOW_NOT_FOUND');
  }
  if (entriesResult.error) {
    console.error('cashflow_entry_lookup_failed', entriesResult.error);
    throw new Error('CASHFLOW_DETAIL_LOOKUP_FAILED');
  }
  if (profileResult.error || shareResult.error || budgetsResult.error) {
    console.error('cashflow_detail_context_lookup_failed', {
      profile: profileResult.error,
      share: shareResult.error,
      budgets: budgetsResult.error,
    });
    throw new Error('CASHFLOW_DETAIL_LOOKUP_FAILED');
  }
  if (goalsResult.error || goalProgressResult.error) {
    console.error('cashflow_goal_detail_lookup_failed', {
      goals: goalsResult.error,
      progress: goalProgressResult.error,
    });
    throw new Error('CASHFLOW_GOAL_LOOKUP_FAILED');
  }
  cashflowTitles.set(cashflow.id, cashflow.title);

  const goalTitlesById = new Map(
    (goalsResult.data ?? []).map((goal) => [goal.id, goal.title] as const),
  );

  const entries = (entriesResult.data ?? []).map((entry) =>
    mapCashflowEntryToDTO(
      entry,
      entry.goal_id ? goalTitlesById.get(entry.goal_id) ?? null : undefined,
    ),
  );
  // Only map budgets if the user is the owner (budgets are owner-only)
  const budgets = isOwner && budgetsResult?.data
    ? budgetsResult.data.map(mapBudgetToDTO)
    : [];

  const goalProgressById = new Map(
    (goalProgressResult.data ?? []).map((progress) => [
      progress.goal_id,
      progress,
    ]),
  );
  const goals = (goalsResult.data ?? []).map((goal) => {
    const progress = goalProgressById.get(goal.id);
    return mapGoalToDTO(
      goal,
      cashflowTitles.get(goal.cashflow_id) ?? null,
      progress?.saved_amount ?? 0,
      progress?.contribution_count ?? 0,
    );
  });

  return {
    cashflow: mapCashflowToDTO(cashflow),
    entries,
    budgets,
    goals,
    profile: profileResult.data,
    share: shareResult.data,
    budgetsResultData: budgetsResult?.data,
  };
}
