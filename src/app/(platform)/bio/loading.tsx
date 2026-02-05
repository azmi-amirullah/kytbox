import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { PlatformHeaderSkeleton } from '@/components/skeletons/platform-header-skeleton';

export default function Loading() {
  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />

      {/* Header Skeleton */}
      <PlatformHeaderSkeleton />

      {/* Main Content */}
      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8 flex-1 w-full'>
        <div className='grid lg:grid-cols-[1fr_400px] gap-8'>
          {/* Left Column: Editor */}
          <div className='space-y-6'>
            {/* Breadcrumb + Title */}
            <div>
              <Skeleton className='h-4 w-32 mb-2' />
              <Skeleton className='h-9 w-24 mb-1' />
              <Skeleton className='h-5 w-48' />
            </div>

            {/* Stats Bar Skeleton */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className='bg-card border rounded-2xl p-4 flex items-center justify-between'
                >
                  <div className='space-y-2'>
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='h-7 w-12' />
                  </div>
                  <Skeleton className='w-10 h-10 rounded-full' />
                </div>
              ))}
            </div>

            {/* Links Editor Skeleton */}
            <div className='space-y-4'>
              <div className='border border-border bg-card rounded-xl overflow-hidden'>
                <div className='flex items-center justify-end px-6 py-4 border-b border-border/50'>
                  <Skeleton className='h-9 w-28' />
                </div>
                <div className='p-6 min-h-[400px] space-y-4'>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className='flex items-center gap-4 p-4 border rounded-xl'
                    >
                      <Skeleton className='h-6 w-6' /> {/* Drag handle */}
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-5 w-48' />
                        <Skeleton className='h-4 w-32' />
                      </div>
                      <Skeleton className='h-8 w-12 rounded-full' />{' '}
                      {/* Switch */}
                      <Skeleton className='h-8 w-8 rounded-md' />{' '}
                      {/* Edit btn */}
                    </div>
                  ))}
                </div>
              </div>

              {/* Appearance Editor Skeleton */}
              <div className='border border-border bg-card rounded-xl p-6 space-y-6'>
                <Skeleton className='h-6 w-32' />
                <div className='grid grid-cols-5 gap-3'>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className='aspect-square rounded-full' />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview Skeleton */}
          <div className='hidden lg:block'>
            <div className='sticky top-24'>
              <div className='flex items-center justify-center mb-4 gap-2'>
                <Skeleton className='h-4 w-32' />
              </div>
              {/* Phone Frame */}
              <div className='mx-auto w-[300px] h-[600px] rounded-[3rem] border-8 border-gray-900 bg-background overflow-hidden relative shadow-xl'>
                <div className='absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-20' />
                <div className='p-6 flex flex-col items-center pt-16 space-y-6 h-full bg-muted/20'>
                  <Skeleton className='w-24 h-24 rounded-full' />
                  <div className='space-y-2 w-full flex flex-col items-center'>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-4 w-48' />
                  </div>
                  <div className='w-full space-y-3'>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-12 w-full rounded-lg' />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
