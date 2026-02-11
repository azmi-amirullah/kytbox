import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SupportTicket } from '@/types/support';
import { formatDistanceToNow } from 'date-fns';
import { LuArrowUp, LuClock } from 'react-icons/lu';
import Link from 'next/link';
import { StatusBadge } from '@/components/support/StatusBadge';
import { EmptyTicketState } from '@/components/support/EmptyTicketState';
import { getUrgencyBadgeClass } from '@/lib/support-urgency';
import { Badge } from '@/components/ui/badge';

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
        {tickets.map((ticket) => {
          const totalUrgency = ticket.total_urgency ?? ticket.urgency_score;
          const ageDays = ticket.age_days ?? 0;
          const bumpPoints = ticket.urgency_score ?? 0;

          return (
            <Link
              key={ticket.id}
              href={`/support-admin/${ticket.id}`}
              className='grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors text-sm'
            >
              <div className='col-span-1 font-mono font-medium'>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                ${getUrgencyBadgeClass(totalUrgency)}`}
                >
                  <LuArrowUp className='w-3 h-3' />
                  {totalUrgency}
                </div>
                <div className='text-[10px] text-muted-foreground mt-1'>
                  {ageDays}d + {bumpPoints}
                </div>
              </div>

              <div className='col-span-5'>
                <div className='font-medium truncate'>{ticket.subject}</div>
                <div className='text-xs text-muted-foreground capitalize'>
                  {ticket.category.replace('_', ' ')}
                </div>
                <div className='mt-1 flex items-center gap-2 flex-wrap'>
                  {(ticket.unread_count || 0) > 0 && (
                    <Badge
                      variant='outline'
                      className='bg-blue-100 text-blue-700 border-blue-200'
                    >
                      Unread User Reply ({ticket.unread_count})
                    </Badge>
                  )}
                  {ticket.awaiting_user_reply && (
                    <Badge
                      variant='outline'
                      className={
                        ticket.user_seen_no_reply
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }
                    >
                      {ticket.user_seen_no_reply
                        ? 'Seen, waiting for user response'
                        : 'Waiting for user response'}
                    </Badge>
                  )}
                  {(ticket.unread_count || 0) === 0 &&
                    ticket.awaiting_admin_reply &&
                    ticket.admin_seen_no_reply && (
                      <Badge
                        variant='outline'
                        className='bg-amber-100 text-amber-700 border-amber-200'
                      >
                        Waiting for your response
                      </Badge>
                    )}
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
                  <div className='truncate max-w-25'>
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
          );
        })}
      </div>
    </div>
  );
}
