import DashboardClient from './components/DashboardClient';
import type { Database } from '@/types/supabase';

export default function Loading() {
  return (
    <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8 w-full'>
      <DashboardClient
        initialLinks={[]}
        profile={{} as Database['public']['Tables']['profiles']['Row']}
        publicUrl=''
        totalViews={0}
        isLoading={true}
      />
    </div>
  );
}
