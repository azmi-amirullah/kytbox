import { Skeleton } from '@/components/ui/skeleton';
import { LuArrowLeft } from 'react-icons/lu';
import { CreateTicketForm } from '@/features/support';

export default function NewTicketLoading() {
  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='mb-6'>
        <div className='inline-flex items-center text-sm text-muted-foreground mb-4'>
          <LuArrowLeft className='mr-2 h-4 w-4' />
          <Skeleton className='h-4 w-32' />
        </div>
        <Skeleton className='h-9 w-64 mb-2' />
        <Skeleton className='h-5 w-80' />
      </div>

      <CreateTicketForm isLoading={true} />
    </div>
  );
}
