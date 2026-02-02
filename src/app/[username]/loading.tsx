import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='min-h-screen w-full bg-background flex flex-col'>
      <div className='w-full max-w-[680px] mx-auto px-6 flex flex-col min-h-screen'>
        {/* Content Section */}
        <div className='flex-1 w-full pt-16 md:pt-24 pb-12 flex flex-col items-center'>
          {/* Profile Header Skeleton */}
          <div className='text-center mb-12 w-full flex flex-col items-center'>
            <div className='relative inline-block mb-6'>
              {/* Avatar Skeleton */}
              <Skeleton className='w-28 h-28 md:w-32 md:h-32 rounded-full' />
            </div>

            {/* Name Skeleton */}
            <Skeleton className='h-8 w-48 mb-3' />

            {/* Bio Skeleton */}
            <div className='space-y-2 w-full max-w-sm flex flex-col items-center'>
              <Skeleton className='h-5 w-full' />
              <Skeleton className='h-5 w-2/3' />
            </div>
          </div>

          {/* Links Skeleton */}
          <div className='w-full space-y-4'>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className='h-14 w-full rounded-xl' />
            ))}
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className='mt-auto py-10 text-center flex justify-center'>
          <Skeleton className='h-8 w-32 rounded-full' />
        </div>
      </div>
    </div>
  );
}
