import { Skeleton } from '@/components/ui/skeleton';

export function ActivityFeedSkeleton() {
  return (
    <section
      className='w-full rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm'
      aria-hidden='true'
    >
      <Skeleton className='h-4 w-32' />
      <Skeleton className='mt-2 h-3 w-48' />

      <div className='relative ml-3 mt-7 space-y-6 border-l border-border/70 pl-5'>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className='relative'>
            <Skeleton className='absolute -left-7.5 top-0.5 size-6 rounded-full' />
            <div className='flex flex-col gap-2 pl-2 sm:flex-row sm:items-baseline sm:justify-between'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
