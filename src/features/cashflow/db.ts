import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getAccessibleCashflows } from './access';
import { DEFAULT_CURRENCY } from '@/lib/currency';
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
  email?: string | null,
  defaultCurrency?: string | null,
): Promise<CashflowSummariesResult> {
  const normalizedEmail = email?.trim().toLowerCase();

  // If defaultCurrency is provided from cached profile (e.g. from getAuthenticatedUserAndProfile),
  // bypass redundant profiles DB query completely.
  const shouldFetchProfile = defaultCurrency === undefined;

  const profilePromise = shouldFetchProfile
    ? supabase
        .from('profiles')
        .select('default_currency')
        .eq('id', userId)
        .maybeSingle()
    : Promise.resolve({ data: { default_currency: defaultCurrency }, error: null });

  const sharesPromise = normalizedEmail
    ? supabase
        .from('cashflow_shares')
        .select('cashflow_id, is_included_in_totals, is_pinned')
        .eq('email', normalizedEmail)
    : Promise.resolve({ data: [], error: null });

  // Parallelize profile and shares queries
  const [profileResult, sharesResult] = await Promise.all([
    profilePromise,
    sharesPromise,
  ]);

  let profile = profileResult.data;
  let shares = sharesResult.data;

  // Profile lookup resilience:
  // If profileResult.error is present (e.g. 504 Gateway Timeout or transient network error), retry once
  if (profileResult.error) {
    if (profileResult.error.code === 'PGRST116') {
      throw new Error('PROFILE_NOT_FOUND');
    }
    console.warn('cashflow_dashboard_profile_lookup_retrying', {
      error: profileResult.error,
      userId,
    });
    const retryProfile = await supabase
      .from('profiles')
      .select('default_currency')
      .eq('id', userId)
      .maybeSingle();

    if (!retryProfile.error) {
      if (!retryProfile.data) {
        throw new Error('PROFILE_NOT_FOUND');
      }
      profile = retryProfile.data;
    } else {
      console.error('cashflow_dashboard_profile_lookup_failed_after_retry', {
        error: retryProfile.error,
        userId,
      });
      // Fallback safely to default currency so a display preference timeout does not crash the dashboard
      profile = { default_currency: DEFAULT_CURRENCY };
    }
  } else if (!profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  // Shares lookup resilience:
  // If sharesResult.error is present, retry once
  if (sharesResult.error && normalizedEmail) {
    console.warn('cashflow_dashboard_shares_lookup_retrying', {
      error: sharesResult.error,
      email: normalizedEmail,
    });
    const retryShares = await supabase
      .from('cashflow_shares')
      .select('cashflow_id, is_included_in_totals, is_pinned')
      .eq('email', normalizedEmail);

    if (!retryShares.error) {
      shares = retryShares.data;
    } else {
      console.error('cashflow_dashboard_shares_lookup_failed_after_retry', {
        error: retryShares.error,
        email: normalizedEmail,
      });
      // Fallback safely to empty shares so user can at least view personal cashflows
      shares = [];
    }
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

  // Helper to build the cashflow_summaries query
  const buildSummariesQuery = () => {
    const q = supabase
      .from('cashflow_summaries')
      .select(
        'id, user_id, title, created_at, updated_at, is_public, is_pinned, is_archived, last_entry_at, entry_count, income, expense, balance',
      )
      .order('created_at', { ascending: false });

    if (allShareIds.length > 0) {
      return q.or(`user_id.eq.${userId},id.in.(${allShareIds.join(',')})`);
    }
    return q.eq('user_id', userId);
  };

  const { data: initialSummariesData, error: cashflowSummariesError } =
    await buildSummariesQuery();
  let cashflowSummariesData = initialSummariesData;

  if (cashflowSummariesError) {
    console.warn('cashflow_dashboard_summary_lookup_retrying', cashflowSummariesError);
    const retrySummaries = await buildSummariesQuery();
    if (retrySummaries.error) {
      console.error('cashflow_dashboard_summary_lookup_failed_after_retry', retrySummaries.error);
      throw new Error('CASHFLOW_DASHBOARD_LOOKUP_FAILED', { cause: retrySummaries.error });
    }
    cashflowSummariesData = retrySummaries.data;
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
      console.warn('cashflow_dashboard_aggregates_lookup_failed_falling_back', aggregateError);
      // Non-fatal: charts will show empty state rather than crashing the dashboard
    } else if (aggregateRows) {
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
  isOwner?: boolean,
  cachedDefaultCurrency?: string | null,
): Promise<CashflowDetailResult & {
  profile: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
    role: string | null;
    default_currency: string | null;
  } | null;
  share: { id: string; role: string; is_pinned: boolean | null } | null;
}> {
  // 1. Immediately launch non-dependent queries and access resolution in parallel
  const accessiblePromise = userId
    ? getAccessibleCashflows(supabase, userId, userEmail, cashflowId)
    : Promise.resolve<{ id: string; title: string }[]>([]);

  const profilePromise = userId
    ? (cachedDefaultCurrency !== undefined
        ? Promise.resolve({
            data: {
              username: '',
              avatar_url: null,
              display_name: null,
              role: null,
              default_currency: cachedDefaultCurrency,
            },
            error: null,
          })
        : supabase
            .from('profiles')
            .select('username, avatar_url, display_name, role, default_currency')
            .eq('id', userId)
            .maybeSingle())
    : Promise.resolve({ data: null, error: null });

  const cashflowPromise = supabase.from('cashflows').select('*').eq('id', cashflowId).single();

  const entriesPromise = supabase
    .from('cashflow_entries')
    .select('*, cashflow_split_entries(*)')
    .eq('cashflow_id', cashflowId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000);

  const recurringRulesPromise = supabase
    .from('cashflow_recurring_rules')
    .select('*')
    .eq('cashflow_id', cashflowId)
    .order('created_at', { ascending: true });

  const sharePromise = userEmail
    ? supabase
        .from('cashflow_shares')
        .select('id, role, is_pinned')
        .eq('cashflow_id', cashflowId)
        .eq('email', userEmail.trim().toLowerCase())
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const budgetsPromise = userId
    ? supabase
        .from('cashflow_budgets')
        .select('*')
        .eq('cashflow_id', cashflowId)
        .order('category', { ascending: true })
    : Promise.resolve({ data: null, error: null });

  const tagsPromise = supabase
    .from('cashflow_tags')
    .select('*')
    .eq('cashflow_id', cashflowId)
    .order('color_index', { ascending: true })
    .order('created_at', { ascending: true });

  // 2. Concurrently chain goals queries as soon as access resolves without blocking initial dispatch
  const goalsWithProgressPromise = accessiblePromise.then(async (accessibleCashflows) => {
    const cashflowTitles = new Map<string, string>();
    for (const accessibleCashflow of accessibleCashflows) {
      cashflowTitles.set(accessibleCashflow.id, accessibleCashflow.title);
    }
    const queryIds = Array.from(
      new Set([cashflowId, ...accessibleCashflows.map((c) => c.id)]),
    );

    const [goalsResult, goalProgressResult] = await Promise.all([
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

    return { cashflowTitles, goalsResult, goalProgressResult };
  });

  const [
    profileResult,
    cashflowResult,
    entriesResult,
    recurringRulesResult,
    shareResult,
    budgetsResult,
    tagsResult,
    goalsData,
  ] = await Promise.all([
    profilePromise,
    cashflowPromise,
    entriesPromise,
    recurringRulesPromise,
    sharePromise,
    budgetsPromise,
    tagsPromise,
    goalsWithProgressPromise,
  ]);

  const { cashflowTitles, goalsResult, goalProgressResult } = goalsData;

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
  if (profileResult.error) {
    console.warn('cashflow_detail_profile_lookup_warning', profileResult.error);
  }
  if (shareResult.error || budgetsResult.error || tagsResult.error || recurringRulesResult.error) {
    console.error('cashflow_detail_context_lookup_failed', {
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

  const goalMetaById = new Map<string, { title: string; type: 'savings' | 'debt' | 'lent' }>(
    (goalsResult.data ?? []).map((goal) => [
      goal.id,
      {
        title: goal.title,
        type: goal.type === 'debt' ? 'debt' : goal.type === 'lent' ? 'lent' : 'savings',
      },
    ]),
  );

  const entries = (entriesResult.data ?? []).map((entry) => {
    const meta = entry.goal_id ? goalMetaById.get(entry.goal_id) : undefined;
    return mapCashflowEntryToDTO(
      entry,
      meta?.title ?? null,
      meta?.type ?? null,
    );
  });

  const recurringRules = (recurringRulesResult.data ?? []).map((rule) => {
    const meta = rule.goal_id ? goalMetaById.get(rule.goal_id) : undefined;
    return mapCashflowRecurringRuleToDTO(
      rule,
      meta?.title ?? null,
      meta?.type ?? null,
    );
  });

  const isActualOwner = isOwner !== undefined ? isOwner : Boolean(userId && cashflow.user_id === userId);
  // Only map budgets if the user is the owner (budgets are owner-only)
  const budgets = isActualOwner && budgetsResult?.data
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
  };
}

/**
 * Fetch pinned cashflows with summary balances for quick access on dashboard
 */
export async function getPinnedCashflows(
  supabase: SupabaseClient<Database>,
  userId: string,
  email?: string | null,
): Promise<CashflowWithSummaryDTO[]> {
  let pinnedShareIds: string[] = [];
  if (email) {
    const { data: shares } = await supabase
      .from('cashflow_shares')
      .select('cashflow_id, is_pinned')
      .eq('email', email.trim().toLowerCase())
      .eq('is_pinned', true);

    if (shares && shares.length > 0) {
      pinnedShareIds = shares
        .map((s) => s.cashflow_id)
        .filter((id): id is string => Boolean(id));
    }
  }

  let query = supabase
    .from('cashflow_summaries')
    .select(
      'id, user_id, title, created_at, updated_at, is_public, is_pinned, is_archived, last_entry_at, entry_count, income, expense, balance',
    )
    .order('updated_at', { ascending: false });

  if (pinnedShareIds.length > 0) {
    query = query.or(
      `and(user_id.eq.${userId},is_pinned.eq.true,is_archived.eq.false),id.in.(${pinnedShareIds.join(',')})`,
    );
  } else {
    query = query
      .eq('user_id', userId)
      .eq('is_pinned', true)
      .eq('is_archived', false);
  }

  const { data, error } = await query;
  if (error) {
    console.error('get_pinned_cashflows_error', error);
    return [];
  }

  const pinnedShareIdSet = new Set(pinnedShareIds);

  return (data || [])
    .filter((c) => !c.is_archived)
    .map((c) => {
      const isOwned = c.user_id === userId;
      const isPinned = isOwned
        ? (c.is_pinned ?? false)
        : (!!c.id && pinnedShareIdSet.has(c.id));
      return {
        ...mapCashflowWithSummaryToDTO(c),
        isPinned,
        isArchived: false,
        isIncluded: true,
      };
    });
}
