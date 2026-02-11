import { LuMessageSquare } from 'react-icons/lu';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyTicketStateProps {
  title: string;
  description: string;
  showCreateButton?: boolean;
}

export function EmptyTicketState({
  title,
  description,
  showCreateButton = false,
}: EmptyTicketStateProps) {
  return (
    <div className='text-center p-8 border border-dashed rounded-lg bg-muted/20'>
      <LuMessageSquare className='mx-auto h-8 w-8 text-muted-foreground mb-4' />
      <h3 className='font-medium text-lg mb-1'>{title}</h3>
      <p className='text-muted-foreground text-sm mb-6'>{description}</p>
      {showCreateButton && (
        <Button asChild>
          <Link href='/support/new'>Create Ticket</Link>
        </Button>
      )}
    </div>
  );
}
