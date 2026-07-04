import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-20' />
        </div>
        <Skeleton className='h-10 w-36' />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='bg-card border rounded-2xl p-5 space-y-3'>
            <Skeleton className='h-5 w-16 rounded-full' />
            <Skeleton className='h-5 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-1.5 w-full rounded-full' />
            <Skeleton className='h-3 w-24' />
          </div>
        ))}
      </div>
    </div>
  );
}
