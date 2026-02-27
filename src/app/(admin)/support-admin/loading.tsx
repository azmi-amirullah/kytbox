import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='max-w-6xl mx-auto py-8 px-4'>
      <div className='flex items-center justify-between mb-8'>
        <div className='space-y-2'>
          <Skeleton className='h-9 w-48' />
          <Skeleton className='h-4 w-64' />
        </div>
      </div>

      <div className='mb-6 h-10 w-48 bg-muted/40 rounded-lg p-1 flex gap-1'>
        <Skeleton className='flex-1 h-full rounded-md' />
        <Skeleton className='flex-1 h-full rounded-md' />
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-64' />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-24 w-full rounded-xl border' />
        ))}
      </div>
    </div>
  );
}
