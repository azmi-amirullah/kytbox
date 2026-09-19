import type { Metadata } from 'next';
import { z } from 'zod';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOptionalUserAndProfile } from '@/lib/auth';
import { getCashflowDetailData, CashflowDetail, schemasServer } from '@/features/cashflow';
import { connection } from 'next/server';

const cashflowIdSchema = z.uuid();

export async function generateMetadata({
  params,
}: CashflowDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!cashflowIdSchema.safeParse(id).success) {
    return {
      title: 'Cashflow',
      description: 'Cashflow tracker',
      robots: { index: false, follow: false },
    };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from('cashflows')
    .select('title')
    .eq('id', id)
    .single();

  const title = data?.title ?? 'Cashflow';
  return {
    title,
    description: `Cashflow tracker — ${title}`,
    robots: { index: false, follow: false },
  };
}

interface CashflowDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CashflowDetailPage({
  params,
}: CashflowDetailPageProps) {
  const { id } = await params;
  if (!cashflowIdSchema.safeParse(id).success) {
    notFound();
  }
  await connection();

  // 1. Get User and Profile from cached fast-path helper
  const { user, profile, supabase: authSupabase } = await getOptionalUserAndProfile();
  const supabase = authSupabase ?? (await createClient());

  // 2. Fetch data via features DB layer
  let data;
  try {
    data = await getCashflowDetailData(
      supabase,
      id,
      user?.id,
      user?.email,
      undefined,
      profile?.default_currency,
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'CASHFLOW_NOT_FOUND' || error.message === 'CASHFLOW_ACCESS_LOOKUP_FAILED') {
        if (!user) redirect('/login');
        notFound();
      }
    }
    throw error;
  }

  const { cashflow, entries, recurringRules, budgets, tags, goals, share } = data;
  const isOwner = Boolean(user && cashflow.user_id === user.id);

  // 3. Access Control
  const isPublic = cashflow.is_public;

  if (!user && !isPublic) {
    redirect('/login');
  }

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
    <CashflowDetail
      key={cashflow.id}
      cashflow={cashflow}
      entries={entries}
      recurringRules={recurringRules}
      budgets={budgets}
      tags={tags}
      goals={goals}
      currency={profile?.default_currency ?? null}
      currentUserId={user?.id}
      initialUserRole={initialUserRole}
      initialShareId={initialShareId}
      initialHasShare={hasShare}
    />
  );
}
