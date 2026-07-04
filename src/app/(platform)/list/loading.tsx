import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='max-w-7xl mx-auto px-4 py-8 md:py-8 w-full space-y-8'>
      {/* Header */}
      <div className='space-y-2'>
        <Skeleton className='h-8 w-24' />
        <Skeleton className='h-4 w-64' />
      </div>

      {/* 3 type cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='bg-card border rounded-2xl p-6 space-y-4'>
            <Skeleton className='w-12 h-12 rounded-xl' />
            <Skeleton className='h-6 w-24' />
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-4 w-16' />
          </div>
        ))}
      </div>
    </div>
  );
}
