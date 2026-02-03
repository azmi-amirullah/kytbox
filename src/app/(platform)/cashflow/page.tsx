import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import CashflowList from './components/CashflowList';

export default async function CashflowPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get user's shares to check inclusion status
  const { data: shares } = await supabase
    .from('cashflow_shares')
    .select('cashflow_id, is_included_in_totals')
    .eq('email', user.email!);

  interface ShareWithInclusion {
    cashflow_id: string;
    is_included_in_totals: boolean;
  }

  interface CashflowSummaryRow {
    id: string;
    user_id: string;
    title: string;
    is_public: boolean;
    created_at: string;
    entry_count: number | string;
    income: number | string;
    expense: number | string;
    balance: number | string;
  }

  const includedShareIds = new Set(
    (shares as unknown as ShareWithInclusion[])
      ?.filter((s) => s.is_included_in_totals)
      .map((s) => s.cashflow_id),
  );

  const allShareIds =
    (shares as unknown as ShareWithInclusion[])?.map((s) => s.cashflow_id) ||
    [];

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

  const cashflowSummaries = (
    (cashflowSummariesData as unknown as CashflowSummaryRow[]) || []
  ).map((c) => ({
    ...c,
    // Ensure numbers are actually numbers (Supabase returns numerics as numbers or strings depending on config)
    is_public: !!c.is_public,
    entryCount: Number(c.entry_count),
    income: Number(c.income),
    expense: Number(c.expense),
    balance: Number(c.balance),
    isIncluded: c.user_id === user.id || includedShareIds.has(c.id), // Owned always included by default logic, shared depends on DB
  }));

  const publicUrl = `/${profile.username}`;

  const userData = {
    username: profile.username,
    email: user.email,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
  };

  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />

      <Header variant='dashboard' user={userData} publicUrl={publicUrl} />

      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8 flex-1 w-full'>
        <CashflowList
          cashflows={cashflowSummaries}
          currency={profile.default_currency}
          currentUserId={user.id}
        />
      </main>

      <Footer />
    </div>
  );
}
