import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { BrandLogo } from '@/components/brand-logo';

export default function Loading() {
  return (
    <div className='min-h-screen relative bg-background flex flex-col'>
      <BackgroundBlobs />

      {/* Header Skeleton - Mimics the dashboard header */}
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

      <main className='relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-8 flex-1 w-full space-y-6'>
        {/* Page Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='space-y-2'>
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-4 w-48' />
          </div>
          <Skeleton className='h-10 w-32' />
        </div>

        {/* Summary Stats Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='bg-card border rounded-xl p-4 space-y-3'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-36' />
            </div>
          ))}
        </div>

        {/* Cashflow List Items */}
        <div className='grid gap-4'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='bg-card border rounded-2xl p-4 sm:p-5 h-[100px]'
            >
              <div className='flex items-center justify-between h-full'>
                <div className='flex items-center gap-4'>
                  <Skeleton className='w-12 h-12 rounded-xl' />
                  <div className='space-y-2'>
                    <Skeleton className='h-6 w-48' />
                    <Skeleton className='h-4 w-24' />
                  </div>
                </div>
                <div className='hidden sm:flex gap-8'>
                  <div className='space-y-2'>
                    <Skeleton className='h-3 w-12 ml-auto' />
                    <Skeleton className='h-5 w-24' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-3 w-12 ml-auto' />
                    <Skeleton className='h-5 w-24' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-3 w-12 ml-auto' />
                    <Skeleton className='h-6 w-24' />
                  </div>
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
