import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { PlatformHeaderSkeleton } from '@/components/skeletons/platform-header-skeleton';

export default function Loading() {
  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />
      <PlatformHeaderSkeleton />

      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8 flex-1 w-full space-y-6'>
        {/* Back Link */}
        <Skeleton className='h-4 w-32' />

        {/* Header Section */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-8 w-48' /> {/* Title */}
              <Skeleton className='h-6 w-20 rounded-full' /> {/* Role Badge */}
            </div>
            <Skeleton className='h-4 w-24' /> {/* Entries count */}
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 w-32' /> {/* Bookmark Button */}
            <Skeleton className='h-10 w-32' /> {/* Add Entry Button */}
          </div>
        </div>

        {/* Summary Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='bg-card border rounded-xl p-4 space-y-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-8 w-32' />
            </div>
          ))}
        </div>

        {/* Entries Table */}
        <div className='bg-card border rounded-xl overflow-hidden'>
          <div className='p-4 border-b'>
            <div className='flex gap-4'>
              <Skeleton className='h-6 w-24' />
              <Skeleton className='h-6 w-48' />
              <Skeleton className='h-6 w-24 ml-auto' />
            </div>
          </div>
          <div className='p-4 space-y-4'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='flex items-center gap-4'>
                <Skeleton className='h-5 w-24' />
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-5 w-24 ml-auto' />
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
