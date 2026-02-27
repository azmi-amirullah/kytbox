import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CashflowList from './components/CashflowList';

export default async function CashflowPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Parallelize profile and shares queries for better performance
  const [profileResult, sharesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
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
  // Filter by owned OR shared (bookmarked)
  let query = supabase
    .from('cashflow_summaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (allShareIds.length > 0) {
    query = query.or(`user_id.eq.${user.id},id.in.(${allShareIds.join(',')})`);
  } else {
    query = query.eq('user_id', user.id);
  }

  const { data: cashflowSummariesData } = await query;

  const cashflowSummaries = (cashflowSummariesData || []).map((c) => ({
    id: c.id || '',
    user_id: c.user_id || '',
    title: c.title || 'Untitled',
    created_at: c.created_at || new Date().toISOString(),
    is_public: !!c.is_public,
    entryCount: Number(c.entry_count),
    income: Number(c.income),
    expense: Number(c.expense),
    balance: Number(c.balance),
    isIncluded: c.user_id === user.id || (!!c.id && includedShareIds.has(c.id)),
    entries: [],
  }));

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
