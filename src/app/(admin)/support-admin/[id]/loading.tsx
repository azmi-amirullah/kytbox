import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='mb-6'>
        <Skeleton className='h-6 w-24 mb-4' />
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <Skeleton className='h-8 w-64 mb-4' />
            <Skeleton className='h-4 w-48 mb-6' />
            <Skeleton className='h-16 w-full rounded-lg' />
          </div>
          <Skeleton className='h-10 w-32 ml-4' />
        </div>
      </div>
      <div className='border rounded-lg p-6 min-h-[400px] space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='flex gap-4'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='space-y-2 flex-1'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-16 w-full' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
