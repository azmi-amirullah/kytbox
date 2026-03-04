import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AnalyticsClient from './components/AnalyticsClient';
import { getAnalyticsData } from './actions';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

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
