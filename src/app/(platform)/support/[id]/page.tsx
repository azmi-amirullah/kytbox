import { MessageList } from '@/app/(platform)/support/components/MessageList';
import { ReplyForm } from '@/app/(platform)/support/components/ReplyForm';
import { UrgencyControl } from '@/app/(platform)/support/components/UrgencyControl';
import { StatusBadge } from '@/components/support/StatusBadge';
import { createClient } from '@/lib/supabase/server';
import { userRoleSchema } from '@/lib/validation.schemas';
import { LuArrowLeft } from 'react-icons/lu';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  // Fetch ticket details
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select(
      'id, user_id, subject, status, category, urgency_score, last_bumped_at',
    )
    .eq('id', id)
    .single();

  if (!ticket || ticket.user_id !== user.id) {
    return notFound();
  }

  const [, { data: messages }] = await Promise.all([
    supabase.rpc('mark_support_messages_read', { p_ticket_id: id }),
    supabase
      .from('support_messages')
      .select('*, profiles(username, avatar_url, role)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
  ]);

  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='mb-6'>
        <Link
          href='/support'
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4'
        >
          <LuArrowLeft className='mr-2 h-4 w-4' />
          Back to Tickets
        </Link>

        <div className='flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <h1 className='text-2xl font-bold tracking-tight'>
                {ticket.subject}
              </h1>
              <StatusBadge status={ticket.status || 'open'} />
            </div>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <p>
                Category: {(ticket.category || 'general').replace('_', ' ')}
              </p>
              <span>•</span>
              <p>ID: {ticket.id}</p>
            </div>
          </div>

          <UrgencyControl
            ticketId={ticket.id}
            score={ticket.urgency_score ?? 0}
            lastBumpedAt={ticket.last_bumped_at}
            status={ticket.status || 'open'}
          />
        </div>
      </div>

      <div className='bg-card border rounded-lg p-6 mb-6 min-h-[400px] max-h-[70vh] overflow-hidden flex flex-col'>
        <div className='flex-1 min-h-0 overflow-y-auto pr-2'>
          <MessageList
            messages={
              (messages || []).map((m) => ({
                ...m,
                created_at: m.created_at || new Date().toISOString(),
                profiles: {
                  ...m.profiles,
                  role: userRoleSchema.parse(m.profiles?.role),
                },
              })) || []
            }
            currentUserId={user.id}
          />
        </div>

        <div className='shrink-0'>
          {ticket.status === 'resolved' || ticket.status === 'closed' ? (
            <div className='mt-6 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground'>
              This ticket is {ticket.status}. Please create a new ticket for
              further assistance.
            </div>
          ) : (
            <ReplyForm ticketId={ticket.id} />
          )}
        </div>
      </div>
    </div>
  );
}
