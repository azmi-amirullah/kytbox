import { MessageList } from '@/app/(platform)/support/components/MessageList';
import { ReplyForm } from '@/app/(platform)/support/components/ReplyForm';
import { StatusSelector } from '@/app/(admin)/support-admin/components/StatusSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { requireAdmin } from '@/lib/admin';
import { getUrgencyBadgeClass } from '@/lib/support-urgency';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { userRoleSchema } from '@/lib/validation.schemas';
import { LuArrowLeft } from 'react-icons/lu';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  // Fetch ticket details with User Profile
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*, profiles(username, avatar_url, bio)')
    .eq('id', id)
    .single();

  if (!ticket) {
    return notFound();
  }

  await supabase.rpc('mark_support_messages_read', { p_ticket_id: id });

  const { data: queueRows } = await supabase.rpc('get_support_ticket_queue');
  const queueTicket = queueRows?.find((queueRow) => queueRow.id === ticket.id);
  const totalUrgency = queueTicket?.total_urgency ?? ticket.urgency_score ?? 0;
  const ageDays = queueTicket?.age_days ?? 0;

  // Fetch messages
  const { data: messagesData } = await supabase
    .from('support_messages')
    .select('*, profiles(username, avatar_url, role)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  const messages = (messagesData || []).map((m) => {
    const role = userRoleSchema.parse(m.profiles?.role);
    return {
      id: m.id,
      ticket_id: m.ticket_id,
      sender_id: m.sender_id,
      message: m.message,
      read_at: m.read_at,
      created_at: m.created_at || new Date().toISOString(),
      profiles: {
        username: m.profiles?.username || 'Unknown',
        avatar_url: m.profiles?.avatar_url || null,
        role,
      },
    };
  });

  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='mb-6'>
        <Link
          href='/support-admin'
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4'
        >
          <LuArrowLeft className='mr-2 h-4 w-4' />
          Back to Queue
        </Link>

        <div className='flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <h1 className='text-2xl font-bold tracking-tight'>
                {ticket.subject}
              </h1>
              <Badge
                variant='outline'
                className={cn(
                  'font-medium',
                  getUrgencyBadgeClass(totalUrgency),
                )}
              >
                Urgency: {totalUrgency}
              </Badge>
              <span className='text-xs text-muted-foreground'>
                {ageDays}d • Category:{' '}
                {(ticket.category || 'general').replace('_', ' ')}
              </span>
            </div>

            {/* User Info Card */}
            <div className='flex items-center gap-3 mt-4 p-3 bg-muted/30 rounded-lg border'>
              <div className='w-10 h-10'>
                <Avatar className='w-full h-full'>
                  <AvatarImage
                    src={ticket.profiles?.avatar_url || ''}
                    alt={ticket.profiles?.username || 'User'}
                  />
                  <AvatarFallback className='text-xs font-bold'>
                    {ticket.profiles?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <div className='font-medium text-sm'>
                  {ticket.profiles?.username}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {ticket.profiles?.bio || 'No bio'}
                </div>
              </div>
            </div>
          </div>

          <StatusSelector
            ticketId={ticket.id}
            currentStatus={ticket.status || 'open'}
          />
        </div>
      </div>

      <div className='bg-card border rounded-lg p-6 mb-6 min-h-[400px] max-h-[70vh] overflow-hidden flex flex-col'>
        <div className='flex-1 min-h-0 overflow-y-auto pr-2'>
          <MessageList messages={messages || []} currentUserId={user.id} />
        </div>

        <div className='mt-8 pt-6 border-t shrink-0'>
          <h3 className='text-sm font-medium mb-2'>Reply as Support</h3>
          <ReplyForm ticketId={ticket.id} />
        </div>
      </div>
    </div>
  );
}
