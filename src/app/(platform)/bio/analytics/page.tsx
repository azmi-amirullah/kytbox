import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { AnalyticsClient, getAnalyticsData } from '@/features/bio';

export default async function AnalyticsPage() {
  const { user, supabase } = await getAuthenticatedUser();

  const [profileResult, initialData] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', user.id).single(),
    getAnalyticsData('24h', 'all'),
  ]);

  if (!profileResult.data) {
    redirect('/onboarding');
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-4 md:py-8 w-full'>
      <AnalyticsClient initialData={initialData} />
    </div>
  );
}
