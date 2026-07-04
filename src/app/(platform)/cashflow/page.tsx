import { getAuthenticatedUser } from '@/lib/auth';
import CashflowList from './components/CashflowList';
import { mapCashflowWithSummaryToDTO } from '@/lib/mappers';
import type { CashflowEntry } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function CashflowPage() {
  const { user, supabase } = await getAuthenticatedUser();

  // Parallelize profile and shares queries for better performance
  const [profileResult, sharesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('default_currency')
      .eq('id', user.id)
      .single(),
    supabase
      .from('cashflow_shares')
      .select('cashflow_id, is_included_in_totals')
      .eq('email', user.email!.toLowerCase())
      .eq('is_pinned', true),
  ]);

  const profile = profileResult.data;
  const shares = sharesResult.data;

  if (!profile) {
    redirect('/onboarding');
  }

  const includedShareIds = new Set(
    shares?.filter((s) => s.is_included_in_totals).map((s) => s.cashflow_id) ||
      [],
  );

  const allShareIds = shares?.map((s) => s.cashflow_id) || [];

  // Get user's cashflow summaries from the view
  let query = supabase
    .from('cashflow_summaries')
    .select(
      'id, user_id, title, created_at, is_public, entry_count, income, expense, balance',
    )
    .order('created_at', { ascending: false });

  if (allShareIds.length > 0) {
    query = query.or(`user_id.eq.${user.id},id.in.(${allShareIds.join(',')})`);
  } else {
    query = query.eq('user_id', user.id);
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
        'id, cashflow_id, amount, type, category, date, description, is_recurring, recurrence_interval, yearly_calculation, created_at',
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

  const cashflowSummaries = (cashflowSummariesData || []).map((c) => {
    const entries = entriesByCashflow.get(c.id || '') || [];
    const dto = mapCashflowWithSummaryToDTO({
      ...c,
      entries,
    });
    return {
      ...dto,
      isIncluded:
        c.user_id === user.id || (!!c.id && includedShareIds.has(c.id)),
    };
  });

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <CashflowList
        cashflows={cashflowSummaries}
        currency={profile.default_currency}
        currentUserId={user.id}
      />
    </div>
  );
}
