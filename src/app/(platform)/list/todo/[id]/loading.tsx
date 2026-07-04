import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='max-w-full mx-auto px-4 py-8 md:py-8 w-full space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <Skeleton className='h-8 w-8 rounded-lg' />
        <Skeleton className='h-7 w-48' />
      </div>

      {/* Columns */}
      <div className='flex gap-4 overflow-x-auto pb-4'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='bg-muted/30 border rounded-xl p-4 min-w-[280px] w-[280px] shrink-0 space-y-3'
          >
            <Skeleton className='h-5 w-24' />
            {[1, 2, 3].map((j) => (
              <div key={j} className='bg-card border rounded-lg p-3 space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
