import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { BrandLogo } from '@/components/brand-logo';

export default function Loading() {
  return (
    <div className='min-h-screen relative flex flex-col'>
      <BackgroundBlobs />

      {/* Header Skeleton */}
      <header className='sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md transition-all duration-200'>
        <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
          <div className='opacity-80'>
            <BrandLogo />
          </div>

          <div className='flex items-center gap-3 md:gap-4'>
            {/* Theme Toggle placeholder */}
            <div className='w-9 h-9 rounded-md bg-muted/50 animate-pulse' />
            {/* User Nav placeholder */}
            <div className='w-8 h-8 rounded-full bg-muted/50 animate-pulse' />
          </div>
        </div>
      </header>

      <main className='relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1 w-full'>
        <div className='mb-8 space-y-3'>
          <Skeleton className='h-9 w-64 md:w-96' />
          <Skeleton className='h-5 w-48' />
        </div>

        {/* App Grid Skeleton */}
        <div className='grid sm:grid-cols-2 gap-4'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='p-6 rounded-2xl border bg-card/50'>
              <div className='flex items-start gap-4'>
                <Skeleton className='w-12 h-12 rounded-xl' />
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-6 w-24' />
                    {i > 2 && <Skeleton className='h-5 w-20 rounded' />}
                  </div>
                  <Skeleton className='h-4 w-full max-w-[180px]' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
