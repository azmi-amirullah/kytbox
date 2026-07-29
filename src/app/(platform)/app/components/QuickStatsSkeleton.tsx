import { Skeleton } from '@/components/ui/skeleton';

export function QuickStatsSkeleton() {
  return (
    <div className='grid w-full gap-2 sm:grid-cols-3' aria-hidden='true'>
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className='rounded-2xl border border-border/80 bg-card p-4 shadow-sm'
        >
          <div className='flex items-center gap-2'>
            <Skeleton className='size-7 rounded-lg' />
            <Skeleton className='h-3 w-24' />
          </div>
          <Skeleton className='mt-3 h-6 w-24' />
          <Skeleton className='mt-1 h-3 w-32' />
        </div>
      ))}
    </div>
  );
}
