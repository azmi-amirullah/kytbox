import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='max-w-3xl mx-auto px-4 py-8 md:py-8 w-full space-y-6'>
      <div className='flex items-center gap-3'>
        <Skeleton className='h-8 w-8 rounded-lg' />
        <Skeleton className='h-7 w-48' />
      </div>
      <Skeleton className='h-10 w-full rounded-lg' />
      <div className='space-y-3'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='flex items-center gap-3 p-4 bg-card border rounded-xl'>
            <Skeleton className='w-5 h-5 rounded' />
            <Skeleton className='h-5 w-1/2' />
            <Skeleton className='h-5 w-20 ml-auto rounded-full' />
          </div>
        ))}
      </div>
      <div className='bg-card border rounded-xl p-4'>
        <Skeleton className='h-5 w-32' />
      </div>
    </div>
  );
}
