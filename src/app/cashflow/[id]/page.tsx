import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { getCashflowDetailData, CashflowDetail, schemasServer } from '@/features/cashflow';
import { connection } from 'next/server';

interface CashflowDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CashflowDetailPage({
  params,
}: CashflowDetailPageProps) {
  const { id } = await params;
  await connection();
  const supabase = await createClient();

  // 1. Get User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnerCheck = async () => {
    if (!user) return false;
    const { data } = await supabase
      .from('cashflows')
      .select('user_id')
      .eq('id', id)
      .single();
    return data?.user_id === user.id;
  };

  const isOwner = await isOwnerCheck();

  // 2. Fetch data via features DB layer
  let data;
  try {
    data = await getCashflowDetailData(
      supabase,
      id,
      user?.id,
      user?.email,
      isOwner
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'CASHFLOW_NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const { cashflow, entries, budgets, profile, share } = data;

  // 3. Access Control
  const isPublic = cashflow.is_public;

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

  // 4. Get Share Status
  let initialUserRole: 'owner' | 'edit' | 'read' | 'public' = 'public';
  let initialShareId: string | null = null;
  let hasShare = false;

  if (user) {
    if (isOwner) {
      initialUserRole = 'owner';
    } else {
      if (share) {
        initialUserRole = schemasServer.shareRoleSchema.parse(share.role);
        initialShareId = share.id;
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

      <main className='relative z-10 max-w-7xl mx-auto px-4 mt-16 py-8 flex-1 w-full'>
        <CashflowDetail
          key={cashflow.id}
          cashflow={cashflow}
          entries={entries}
          budgets={budgets}
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
