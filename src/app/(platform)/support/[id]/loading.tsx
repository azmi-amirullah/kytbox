import { Skeleton } from '@/components/ui/skeleton';
import { LuArrowLeft } from 'react-icons/lu';

export default function TicketDetailLoading() {
  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='mb-6'>
        <div className='inline-flex items-center text-sm text-muted-foreground mb-4'>
          <LuArrowLeft className='mr-2 h-4 w-4' />
          <Skeleton className='h-4 w-24' />
        </div>

        <div className='flex items-start justify-between'>
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-8 w-64' />
              <Skeleton className='h-6 w-20 rounded-full' />
            </div>
            <div className='flex items-center gap-4'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-48' />
            </div>
          </div>
          <Skeleton className='h-10 w-32' />
        </div>
      </div>

      <div className='bg-card border rounded-lg p-6 mb-6 min-h-[400px] flex flex-col space-y-6'>
        <div className='flex-1 space-y-6'>
          <div className='flex gap-3 justify-start'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <Skeleton className='h-20 w-3/4 rounded-xl' />
          </div>
          <div className='flex gap-3 justify-end'>
            <Skeleton className='h-16 w-1/2 rounded-xl' />
            <Skeleton className='h-8 w-8 rounded-full' />
          </div>
          <div className='flex gap-3 justify-start'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <Skeleton className='h-24 w-2/3 rounded-xl' />
          </div>
        </div>
        <Skeleton className='h-32 w-full rounded-xl' />
      </div>
    </div>
  );
}
