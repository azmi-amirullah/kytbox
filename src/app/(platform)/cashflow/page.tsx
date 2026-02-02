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

  // Get user's cashflow summaries from the view
  const { data: cashflowSummariesData } = await supabase
    .from('cashflow_summaries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  interface CashflowSummaryRow {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    entry_count: number | string;
    income: number | string;
    expense: number | string;
    balance: number | string;
  }

  const cashflowSummaries = (
    (cashflowSummariesData as unknown as CashflowSummaryRow[]) || []
  ).map((c) => ({
    ...c,
    // Ensure numbers are actually numbers (Supabase returns numerics as numbers or strings depending on config)
    entryCount: Number(c.entry_count),
    income: Number(c.income),
    expense: Number(c.expense),
    balance: Number(c.balance),
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
        />
      </main>

      <Footer />
    </div>
  );
}
