import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/footer';
import { BackgroundBlobs } from '@/components/background-blobs';
import { BrandLogo } from '@/components/brand-logo';

export default function Loading() {
  return (
    <div className='relative min-h-screen flex flex-col'>
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
            {/* Auth Button placeholder */}
            <div className='w-20 h-10 rounded-md bg-muted/50 animate-pulse' />
          </div>
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <main className='flex-1 relative z-10'>
        <section className='pt-24 pb-20 px-6 text-center'>
          <div className='max-w-4xl mx-auto space-y-8 flex flex-col items-center'>
            {/* Badge */}
            <Skeleton className='h-8 w-32 rounded-full' />

            {/* Title */}
            <div className='space-y-4 flex flex-col items-center w-full'>
              <Skeleton className='h-16 w-3/4 max-w-2xl' />
              <Skeleton className='h-16 w-1/2 max-w-lg' />
            </div>

            {/* Description */}
            <div className='space-y-2 flex flex-col items-center w-full pt-4'>
              <Skeleton className='h-6 w-full max-w-xl' />
              <Skeleton className='h-6 w-3/4 max-w-lg' />
            </div>

            {/* CTA Button */}
            <div className='pt-8'>
              <Skeleton className='h-12 w-48 rounded-md' />
            </div>
          </div>
        </section>

        {/* Apps Grid Skeleton */}
        <section className='py-16 px-6'>
          <div className='max-w-5xl mx-auto'>
            {/* Section Title */}
            <div className='flex justify-center mb-12'>
              <Skeleton className='h-10 w-64' />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className='p-6 rounded-2xl border bg-card h-48 flex flex-col'
                >
                  <Skeleton className='w-12 h-12 rounded-xl mb-4' />
                  <div className='mb-2'>
                    <Skeleton className='h-6 w-24' />
                  </div>
                  <Skeleton className='h-4 w-full mt-auto' />
                  <Skeleton className='h-4 w-3/4 mt-2' />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer variant='landing' />
    </div>
  );
}
