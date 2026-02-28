import { TicketList } from '@/app/(platform)/support/components/TicketList';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { LuPlus } from 'react-icons/lu';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ticketCategorySchema,
  ticketStatusSchema,
} from '@/lib/validation.schemas';

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
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const ticketIds = (tickets || []).map((ticket) => ticket.id);
  const unreadByTicket = new Map<string, number>();
  const awaitingReplyByTicket = new Map<string, boolean>();
  const seenNoReplyByTicket = new Map<string, boolean>();

  if (ticketIds.length > 0) {
    const { data: ticketMessages } = await supabase
      .from('support_messages')
      .select('ticket_id, created_at, read_at, profiles(role)')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true });

    const lastMessageByTicket = new Map<
      string,
      { senderRole: string | null; readAt: string | null }
    >();

    (ticketMessages || []).forEach((message) => {
      const senderRole = message.profiles?.role || null;

      if (senderRole === 'admin' && !message.read_at) {
        unreadByTicket.set(
          message.ticket_id,
          (unreadByTicket.get(message.ticket_id) || 0) + 1,
        );
      }

      lastMessageByTicket.set(message.ticket_id, {
        senderRole,
        readAt: message.read_at,
      });
    });

    lastMessageByTicket.forEach((lastMessage, ticketId) => {
      const awaitingUserReply = lastMessage.senderRole === 'admin';
      awaitingReplyByTicket.set(ticketId, awaitingUserReply);
      seenNoReplyByTicket.set(
        ticketId,
        awaitingUserReply && Boolean(lastMessage.readAt),
      );
    });
  }

  const ticketsWithSignals = (tickets || []).map((ticket) => {
    const category = ticketCategorySchema.parse(ticket.category);
    const status = ticketStatusSchema.parse(ticket.status);

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
