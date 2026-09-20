import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { getAccessibleCashflows } from '@/features/cashflow/access';
import { QuickLogForm } from '@/features/cashflow';
import { mapCashflowEntryToDTO } from '@/lib/mappers';

export const metadata: Metadata = {
  title: 'Quick Log | Cashflow',
  description: 'Log an expense or income in under 2 seconds',
  robots: { index: false, follow: false },
};

interface QuickLogPageProps {
  searchParams: Promise<{
    bookId?: string;
  }>;
}

export default async function QuickLogPage({
  searchParams,
}: QuickLogPageProps) {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  if (!profile) {
    redirect('/onboarding');
  }

  const { bookId } = await searchParams;

  // Resolve books user has access to (both owned and shared)
  const accessibleBooks = await getAccessibleCashflows(
    supabase,
    user.id,
    user.email,
    bookId,
  );

  // Filter for books the user has permission to log entries into (owner or edit role only - never read-only)
  const editableBooks = accessibleBooks.filter(
    (b) => b.role === 'owner' || b.role === 'edit',
  );

  if (editableBooks.length === 0) {
    redirect('/cashflow');
  }

  const validUrlBookId =
    bookId && editableBooks.some((b) => b.id === bookId) ? bookId : undefined;

  const activeBookId = validUrlBookId || editableBooks[0].id;

  // Fetch recent entries to power in-memory merchant learning
  const { data: rawEntries } = await supabase
    .from('cashflow_entries')
    .select(
      'id, cashflow_id, goal_id, description, amount, type, category, date, is_recurring, recurrence_interval, yearly_calculation, tags, receipt_url, original_currency, original_amount, exchange_rate, recurring_rule_id, created_at',
    )
    .eq('cashflow_id', activeBookId)
    .order('date', { ascending: false })
    .limit(1000);

  const recentEntries = rawEntries
    ? rawEntries.map((row) => mapCashflowEntryToDTO(row))
    : [];

  return (
    <div className='min-h-[calc(100vh-4rem)] flex flex-col justify-center py-4'>
      <QuickLogForm
        books={editableBooks}
        defaultBookId={activeBookId}
        urlBookId={validUrlBookId}
        defaultCurrency={profile.default_currency || 'USD'}
        recentEntries={recentEntries}
      />
    </div>
  );
}
