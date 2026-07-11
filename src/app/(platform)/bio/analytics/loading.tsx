import { AnalyticsClient } from '@/features/bio';

export default function Loading() {
  return (
    <div className='max-w-7xl mx-auto px-4 py-4 md:py-8 w-full'>
      <AnalyticsClient
        initialData={{
          chartData: [],
          totalClicks: 0,
          totalViews: 0,
          ctr: 0,
          topLinks: [],
          topReferer: null,
          userLinks: [],
        }}
        isLoading={true}
      />
    </div>
  );
}
