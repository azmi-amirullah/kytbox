import { Skeleton } from '@/components/ui/skeleton';

export default function SupportLoading() {
  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <Skeleton className='h-9 w-32 mb-1' />
          <Skeleton className='h-5 w-64' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>

      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='p-6 border rounded-xl bg-card/30'>
            <div className='flex justify-between items-start mb-4'>
              <div className='space-y-2'>
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-4 w-24' />
              </div>
              <Skeleton className='h-6 w-20 rounded-full' />
            </div>
            <div className='flex gap-2'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-16' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
