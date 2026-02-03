import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import CashflowDetail from '../../(platform)/cashflow/components/CashflowDetail';

interface CashflowDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CashflowDetailPage({
  params,
}: CashflowDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Get User (don't redirect yet)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Load Profile (only if user exists)
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // 3. Get Cashflow
  // RLS will ensure we only see what allowed.
  // Public cashflows are visible to anon.
  const { data: cashflow } = await supabase
    .from('cashflows')
    .select('*')
    .eq('id', id)
    .single();

  if (!cashflow) {
    notFound();
  }

  // 4. Access Control
  const isPublic = cashflow.is_public;

  // We rely on RLS, but if RLS allowed it (e.g. public), we are good.
  // Ideally, if it's NOT public and we are NOT logged in, RLS would return nothing anyway
  // and we'd hit 404.
  // BUT: If the user is not logged in, they might see a public cashflow.

  // If we found a cashflow, it means we have access (public or owner/shared).
  // However, verify logic:
  // If !user and !isPublic -> The user shouldn't have been able to fetch it unless RLS failed.
  // Actually, for "Join via Link" scenarios where RLS might not cover "invitations" not yet accepted
  // (which is not the case here, invites are by email), we are safe.

  // Explicit check for better UX:
  if (!user && !isPublic) {
    redirect('/login');
  }

  // Get entries
  const { data: entries } = await supabase
    .from('cashflow_entries')
    .select('*')
    .eq('cashflow_id', id)
    .order('date', { ascending: false });

  // Prepare UI Data
  const publicUrl = profile ? `/${profile.username}` : undefined;

  const userData =
    user && profile
      ? {
          username: profile.username,
          email: user.email,
          avatar_url: profile.avatar_url,
          display_name: profile.display_name,
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
      const { data: share } = await supabase
        .from('cashflow_shares')
        .select('id, role, is_pinned')
        .eq('cashflow_id', id)
        .eq('email', user.email!.toLowerCase())
        .maybeSingle();

      if (share) {
        initialUserRole = share.role || 'read';
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
          cashflow={cashflow}
          entries={entries ?? []}
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
