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

  // Get user's cashflows only (no entries needed for list view)
  const { data: cashflows } = await supabase
    .from('cashflows')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get entry counts for each cashflow
  const cashflowIds = cashflows?.map((c) => c.id) ?? [];
  const { data: entries } = await supabase
    .from('cashflow_entries')
    .select('cashflow_id, amount, type')
    .in('cashflow_id', cashflowIds.length > 0 ? cashflowIds : ['']);

  // Calculate summary for each cashflow
  const cashflowSummaries =
    cashflows?.map((cashflow) => {
      const cashflowEntries =
        entries?.filter((e) => e.cashflow_id === cashflow.id) ?? [];
      const income = cashflowEntries
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const expense = cashflowEntries
        .filter((e) => e.type === 'expense')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        ...cashflow,
        entryCount: cashflowEntries.length,
        income,
        expense,
        balance: income - expense,
      };
    }) ?? [];

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
