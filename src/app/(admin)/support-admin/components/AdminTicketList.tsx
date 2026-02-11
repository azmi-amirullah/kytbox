import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SupportTicket } from '@/types/support';
import { formatDistanceToNow } from 'date-fns';
import { LuArrowUp, LuClock } from 'react-icons/lu';
import Link from 'next/link';
import { StatusBadge } from '@/components/support/StatusBadge';
import { EmptyTicketState } from '@/components/support/EmptyTicketState';

interface AdminTicketListProps {
  tickets: SupportTicket[];
}

export function AdminTicketList({ tickets }: AdminTicketListProps) {
  if (tickets.length === 0) {
    return (
      <EmptyTicketState
        title='No tickets found'
        description='Great job! The queue is empty.'
      />
    );
  }

  return (
    <div className='rounded-md border'>
      <div className='grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm text-muted-foreground'>
        <div className='col-span-1'>Urgency</div>
        <div className='col-span-5'>Subject</div>
        <div className='col-span-2'>Status</div>
        <div className='col-span-2'>User</div>
        <div className='col-span-2 text-right'>Created</div>
      </div>

      <div className='divide-y'>
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/support-admin/${ticket.id}`}
            className='grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors text-sm'
          >
            <div className='col-span-1 font-mono font-medium'>
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                ${
                  ticket.urgency_score > 20
                    ? 'bg-red-100 text-red-700'
                    : ticket.urgency_score > 0
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                <LuArrowUp className='w-3 h-3' />
                {ticket.urgency_score}
              </div>
            </div>

            <div className='col-span-5'>
              <div className='font-medium truncate'>{ticket.subject}</div>
              <div className='text-xs text-muted-foreground capitalize'>
                {ticket.category.replace('_', ' ')}
              </div>
            </div>

            <div className='col-span-2'>
              <StatusBadge status={ticket.status} />
            </div>

            <div className='col-span-2'>
              <div className='flex items-center gap-2'>
                <Avatar className='w-6 h-6'>
                  <AvatarImage
                    src={ticket.profiles?.avatar_url || ''}
                    alt={ticket.profiles?.username || 'User'}
                  />
                  <AvatarFallback className='text-[10px] font-bold'>
                    {ticket.profiles?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='truncate max-w-[100px]'>
                  {ticket.profiles?.username || 'Unknown'}
                </div>
              </div>
            </div>

            <div className='col-span-2 text-right text-muted-foreground'>
              <div className='flex items-center justify-end gap-1'>
                <LuClock className='w-3 h-3' />
                <span>
                  {formatDistanceToNow(new Date(ticket.created_at))} ago
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
