import { getAuthenticatedUser } from '@/lib/auth';
import { getCashflowDashboardData, CashflowList } from '@/features/cashflow';
import { redirect } from 'next/navigation';

export default async function CashflowPage() {
  const { user, supabase } = await getAuthenticatedUser();

  let dashboardData;
  try {
    dashboardData = await getCashflowDashboardData(
      supabase,
      user.id,
      user.email!
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'PROFILE_NOT_FOUND') {
      redirect('/onboarding');
    }
    throw error;
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full'>
      <CashflowList
        cashflows={dashboardData.cashflows}
        currency={dashboardData.defaultCurrency}
        currentUserId={user.id}
      />
    </div>
  );
}
