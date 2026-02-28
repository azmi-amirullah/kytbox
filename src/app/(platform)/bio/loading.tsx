import DashboardClient from './components/DashboardClient';

export default function Loading() {
  return (
    <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8 w-full'>
      <DashboardClient
        initialLinks={[]}
        profile={{}}
        publicUrl=''
        totalViews={0}
        isLoading={true}
      />
    </div>
  );
}
