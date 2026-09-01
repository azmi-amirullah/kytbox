import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getAccessibleCashflows } from './access';
import {
  mapCashflowWithSummaryToDTO,
  mapCashflowToDTO,
  mapCashflowEntryToDTO,
  mapCashflowRecurringRuleToDTO,
  mapBudgetToDTO,
  mapGoalToDTO,
  mapTagToDTO,
} from '@/lib/mappers';
import type {
  CashflowDTO,
  CashflowEntryDTO,
  CashflowRecurringRuleDTO,
  CashflowBudgetDTO,
  CashflowTagDTO,
  CashflowGoalDTO,
  CashflowWithSummaryDTO,
  CashflowChartAggregateDTO,
} from '@/types/dto';

export interface CashflowSummariesResult {
  cashflows: (CashflowWithSummaryDTO & { isIncluded: boolean })[];
  aggregates: CashflowChartAggregateDTO[];
  defaultCurrency: string | null;
}

export interface CashflowDetailResult {
  cashflow: CashflowDTO;
  entries: CashflowEntryDTO[];
  recurringRules: CashflowRecurringRuleDTO[];
  budgets: CashflowBudgetDTO[];
  tags: CashflowTagDTO[];
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
      .select('cashflow_id, is_included_in_totals, is_pinned')
      .eq('email', email.trim().toLowerCase()),
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

  const pinnedShareIds = new Set(
    shares?.filter((s) => s.is_pinned !== false).map((s) => s.cashflow_id) || [],
  );

  const includedShareIds = new Set(
    shares
      ?.filter((s) => s.is_pinned !== false && s.is_included_in_totals)
      .map((s) => s.cashflow_id) || [],
  );

  const allShareIds = shares?.map((s) => s.cashflow_id) || [];

  // Get user's cashflow summaries from the view
  let query = supabase
    .from('cashflow_summaries')
    .select(
      'id, user_id, title, created_at, updated_at, is_public, is_pinned, is_archived, last_entry_at, entry_count, income, expense, balance',
    )
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

  // Active summaries (active owned + pinned shares) to aggregate charts for
  const activeSummaryIds: string[] = (cashflowSummariesData || [])
    .filter(
      (c) =>
        (c.user_id === userId && !c.is_archived) ||
        (c.user_id !== userId && !!c.id && pinnedShareIds.has(c.id)),
    )
    .map((c) => c.id)
    .filter((id): id is string => Boolean(id));

  // Fetch pre-aggregated chart buckets for dashboard charts via RPC
  let aggregates: CashflowChartAggregateDTO[] = [];

  if (activeSummaryIds.length > 0) {
    const { data: aggregateRows, error: aggregateError } = await supabase.rpc(
      'get_cashflow_chart_aggregates',
      {
        p_cashflow_ids: activeSummaryIds,
      }
    );

    if (aggregateError) {
      console.error('cashflow_dashboard_aggregates_lookup_failed', aggregateError);
      throw new Error('CASHFLOW_DASHBOARD_LOOKUP_FAILED');
    }

    if (aggregateRows) {
      aggregates = aggregateRows.map((row) => ({
        cashflow_id: row.cashflow_id,
        month: row.month,
        type: row.type === 'income' ? 'income' : 'expense',
        category: row.category,
        total_amount: Number(row.total_amount) || 0,
      }));
    }
  }

  const cashflows = (cashflowSummariesData || []).map((c) => {
    const dto = mapCashflowWithSummaryToDTO(c);
    const isOwned = c.user_id === userId;
    const isPinned = isOwned ? (c.is_pinned ?? false) : (!!c.id && pinnedShareIds.has(c.id));
    const isArchived = isOwned ? (c.is_archived ?? false) : false;
    return {
      ...dto,
      isPinned,
      isArchived,
      isIncluded: isOwned ? !isArchived : (!!c.id && includedShareIds.has(c.id)),
    };
  });

  return {
    cashflows,
    aggregates,
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

  // Parallelize: profile, cashflow, entries, share, budgets, tags, goals, contributions
  const [
    profileResult,
    cashflowResult,
    entriesResult,
    recurringRulesResult,
    shareResult,
    budgetsResult,
    tagsResult,
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
      supabase
        .from('cashflow_recurring_rules')
        .select('*')
        .eq('cashflow_id', cashflowId)
        .order('created_at', { ascending: true }),
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
        .from('cashflow_tags')
        .select('*')
        .eq('cashflow_id', cashflowId)
        .order('color_index', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('cashflow_goals')
        .select('*')
        .in('cashflow_id', queryIds)
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
  if (profileResult.error || shareResult.error || budgetsResult.error || tagsResult.error || recurringRulesResult.error) {
    console.error('cashflow_detail_context_lookup_failed', {
      profile: profileResult.error,
      share: shareResult.error,
      budgets: budgetsResult.error,
      tags: tagsResult.error,
      recurringRules: recurringRulesResult.error,
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

  const recurringRules = (recurringRulesResult.data ?? []).map((rule) =>
    mapCashflowRecurringRuleToDTO(
      rule,
      rule.goal_id ? goalTitlesById.get(rule.goal_id) ?? null : undefined,
    ),
  );

  // Only map budgets if the user is the owner (budgets are owner-only)
  const budgets = isOwner && budgetsResult?.data
    ? budgetsResult.data.map(mapBudgetToDTO)
    : [];

  const tags = (tagsResult?.data ?? []).map(mapTagToDTO);

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
    recurringRules,
    budgets,
    tags,
    goals,
    profile: profileResult.data,
    share: shareResult.data,
    budgetsResultData: budgetsResult?.data,
  };
}
