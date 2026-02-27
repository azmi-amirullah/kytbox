import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import CashflowDetail from '../../(platform)/cashflow/components/CashflowDetail';
import { mapCashflowToDTO, mapCashflowEntryToDTO } from '@/lib/mappers';

interface CashflowDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CashflowDetailPage({
  params,
}: CashflowDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Get User (don't redirect yet - public pages don't require login)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Parallelize: profile (if user) AND cashflow + entries + share
  const [profileResult, cashflowResult, entriesResult, shareResult] =
    await Promise.all([
      user
        ? supabase.from('profiles').select('*').eq('id', user.id).single()
        : Promise.resolve({ data: null }),
      supabase.from('cashflows').select('*').eq('id', id).single(),
      supabase
        .from('cashflow_entries')
        .select('*')
        .eq('cashflow_id', id)
        .order('date', { ascending: false }),
      user?.email
        ? supabase
            .from('cashflow_shares')
            .select('id, role, is_pinned')
            .eq('cashflow_id', id)
            .eq('email', user.email.toLowerCase())
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const profile = profileResult.data;
  const cashflow = cashflowResult.data;
  const entries = entriesResult.data;
  const share = shareResult.data;

  if (!cashflow) {
    notFound();
  }

  // 4. Access Control
  const isPublic = cashflow.is_public;

  // Explicit check for better UX:
  if (!user && !isPublic) {
    redirect('/login');
  }

  // Prepare UI Data
  const publicUrl = profile ? `/${profile.username}` : undefined;

  const userData =
    user && profile
      ? {
          username: profile.username,
          email: user.email,
          avatar_url: profile.avatar_url,
          display_name: profile.display_name,
          role: profile.role,
        }
      : undefined;

  // 5. Get Share Status (Server-Side)
  let initialUserRole: 'owner' | 'edit' | 'read' | 'public' = 'public';
  let initialShareId: string | null = null;
  let hasShare = false;

  if (user) {
    if (cashflow.user_id === user.id) {
      initialUserRole = 'owner';
    } else {
      if (share) {
        initialUserRole = (share.role as 'edit' | 'read') || 'read';
        initialShareId = share.id;
        // The bookmark button should show "Saved" ONLY if it is pinned to the dashboard
        hasShare = !!share.is_pinned;
      } else if (isPublic) {
        initialUserRole = 'read';
      }
    }
  } else if (isPublic) {
    initialUserRole = 'read';
  }

  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />

      <Header variant='dashboard' user={userData} publicUrl={publicUrl} />

      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8 flex-1 w-full'>
        <CashflowDetail
          key={cashflow.id}
          cashflow={mapCashflowToDTO(cashflow)}
          entries={(entries ?? []).map(mapCashflowEntryToDTO)}
          currency={profile?.default_currency ?? null}
          currentUserId={user?.id}
          initialUserRole={initialUserRole}
          initialShareId={initialShareId}
          initialHasShare={hasShare}
        />
      </main>

      <Footer />
    </div>
  );
}
