import { TicketList, schemasServer } from '@/features/support';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { LuPlus } from 'react-icons/lu';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Support | Kytbox',
  description: 'Manage your support tickets.',
};

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(
      'id, category, status, urgency_score, created_at, subject, user_id, last_bumped_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const ticketIds = (tickets || []).map((ticket) => ticket.id);
  const unreadByTicket = new Map<string, number>();
  const awaitingReplyByTicket = new Map<string, boolean>();
  const seenNoReplyByTicket = new Map<string, boolean>();

  if (ticketIds.length > 0) {
    const { data: ticketMessages } = await supabase
      .from('support_tickets')
      .select(`
        id,
        support_messages (
          ticket_id,
          created_at,
          profiles!support_messages_sender_id_fkey(role),
          support_message_reads(reader_id)
        )
      `)
      .in('id', ticketIds)
      .order('created_at', { ascending: false, foreignTable: 'support_messages' })
      .limit(1, { foreignTable: 'support_messages' });

    (ticketMessages || []).forEach((ticketMsgObj) => {
      const ticketId = ticketMsgObj.id;
      const messages = ticketMsgObj.support_messages || [];
      const message = Array.isArray(messages) ? messages[0] : messages;

      if (!message) return;

      const profiles = Array.isArray(message.profiles)
        ? message.profiles[0]
        : message.profiles;
      const senderRole = schemasServer.userRoleSchema.parse(profiles?.role);
      
      const rawReads = message.support_message_reads || [];
      const reads = Array.isArray(rawReads) ? rawReads : [rawReads];

      const userHasRead = reads.some((r) => r.reader_id === user.id);

      if (senderRole === 'admin' && !userHasRead) {
        unreadByTicket.set(ticketId, 1);
      }

      const awaitingUserReply = senderRole === 'admin';
      awaitingReplyByTicket.set(ticketId, awaitingUserReply);
      
      seenNoReplyByTicket.set(ticketId, awaitingUserReply && userHasRead);
    });
  }

  const ticketsWithSignals = (tickets || []).map((ticket) => {
    const category = schemasServer.ticketCategorySchema.parse(ticket.category);
    const status = schemasServer.ticketStatusSchema.parse(ticket.status);

    return {
      ...ticket,
      category,
      status,
      urgency_score: ticket.urgency_score ?? 0,
      created_at: ticket.created_at || new Date().toISOString(),
      unread_count: unreadByTicket.get(ticket.id) || 0,
      awaiting_user_reply: awaitingReplyByTicket.get(ticket.id) || false,
      user_seen_no_reply: seenNoReplyByTicket.get(ticket.id) || false,
    };
  });

  return (
    <div className='max-w-4xl mx-auto py-8 px-4'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Support</h1>
          <p className='text-muted-foreground mt-1'>
            View your ticket history or create a new request.
          </p>
        </div>
        <Button asChild>
          <Link href='/support/new'>
            <LuPlus className='mr-2 h-4 w-4' />
            New Ticket
          </Link>
        </Button>
      </div>

      <TicketList tickets={ticketsWithSignals} />
    </div>
  );
}
