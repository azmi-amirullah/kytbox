import type { Metadata } from 'next';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { getCashflowDashboardData, CashflowList } from '@/features/cashflow';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Cashflow',
  robots: { index: false, follow: false },
};

export default async function CashflowPage() {
  const { user, profile, supabase } = await getAuthenticatedUserAndProfile();

  if (!profile) {
    redirect('/onboarding');
  }

  const dashboardData = await getCashflowDashboardData(
    supabase,
    user.id,
    user.email,
    profile.default_currency,
  );

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <CashflowList
        cashflows={dashboardData.cashflows}
        aggregates={dashboardData.aggregates}
        currency={dashboardData.defaultCurrency}
        currentUserId={user.id}
      />
    </div>
  );
}
