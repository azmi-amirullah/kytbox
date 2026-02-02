import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import CashflowDetail from '../components/CashflowDetail';

interface CashflowDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CashflowDetailPage({
  params,
}: CashflowDetailPageProps) {
  const { id } = await params;
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

  // Get the specific cashflow
  const { data: cashflow } = await supabase
    .from('cashflows')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!cashflow) {
    notFound();
  }

  // Get entries for this cashflow
  const { data: entries } = await supabase
    .from('cashflow_entries')
    .select('*')
    .eq('cashflow_id', id)
    .order('date', { ascending: false });

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
        <CashflowDetail
          cashflow={cashflow}
          entries={entries ?? []}
          currency={profile.default_currency}
        />
      </main>

      <Footer />
    </div>
  );
}
