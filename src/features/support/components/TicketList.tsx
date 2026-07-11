import { SupportTicket } from '@/types/support';
import { formatDistanceToNow } from 'date-fns';
import { LuArrowUp, LuClock } from 'react-icons/lu';
import Link from 'next/link';
import { StatusBadge } from '@/components/support/StatusBadge';
import { EmptyTicketState } from '@/components/support/EmptyTicketState';
import { Badge } from '@/components/ui/badge';

interface TicketListProps {
  tickets: SupportTicket[];
}

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <EmptyTicketState
        title='No tickets yet'
        description='Need help? Create your first support ticket.'
        showCreateButton
      />
    );
  }

  return (
    <div className='space-y-4'>
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/support/${ticket.id}`}
          className='block p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card'
        >
          <div className='flex items-start justify-between mb-2'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='font-medium text-lg'>{ticket.subject}</h3>
                <StatusBadge status={ticket.status} />
                {(ticket.unread_count || 0) > 0 && (
                  <Badge
                    variant='outline'
                    className='bg-red-100 text-red-700 border-red-200'
                  >
                    New Reply ({ticket.unread_count})
                  </Badge>
                )}
                {(ticket.unread_count || 0) === 0 &&
                  ticket.awaiting_user_reply &&
                  ticket.user_seen_no_reply && (
                    <Badge
                      variant='outline'
                      className='bg-amber-100 text-amber-700 border-amber-200'
                    >
                      Waiting for your response
                    </Badge>
                  )}
              </div>
              <p className='text-sm text-muted-foreground capitalize'>
                Category: {ticket.category.replace('_', ' ')}
              </p>
            </div>
            <div className='flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full'>
              <LuArrowUp className='w-3 h-3' />
              <span>Urgency: {ticket.urgency_score}</span>
            </div>
          </div>

          <div className='flex items-center gap-4 text-xs text-muted-foreground mt-4'>
            <div className='flex items-center gap-1'>
              <LuClock className='w-3 h-3' />
              <span>
                Created {formatDistanceToNow(new Date(ticket.created_at))} ago
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
