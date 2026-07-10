import { AdminTicketList } from '@/app/(admin)/support-admin/components/AdminTicketList';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { SupportTicket } from '@/types/support';
import {
  ticketCategorySchema,
  ticketStatusSchema,
  userRoleSchema,
} from '@/lib/validation.schemas';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Support | Kytbox',
};

const ACTIVE_TICKET_STATUSES: SupportTicket['status'][] = [
  'open',
  'in_progress',
];
const RESOLVED_TICKET_STATUSES: SupportTicket['status'][] = [
  'resolved',
  'closed',
];

type QueueTab = 'active' | 'resolved';

function getQueueTab(tabValue?: string): QueueTab {
  return tabValue === 'resolved' ? 'resolved' : 'active';
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const selectedTab = getQueueTab(tab);

  await requireAdmin();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: ticketQueue, error } = await supabase.rpc(
    'get_support_ticket_queue',
  );

  if (error) {
    throw new Error(`Failed to load support queue: ${error.message}`);
  }

  const allTickets: SupportTicket[] = (ticketQueue || []).map((ticket) => ({
    id: ticket.id,
    user_id: ticket.user_id,
    subject: ticket.subject,
    category: ticketCategorySchema.parse(ticket.category),
    status: ticketStatusSchema.parse(ticket.status),
    urgency_score: ticket.urgency_score ?? 0,
    last_bumped_at: ticket.last_bumped_at,
    created_at: ticket.created_at,
    age_days: ticket.age_days ?? 0,
    total_urgency: ticket.total_urgency ?? 0,
    profiles: {
      username: ticket.username || 'Unknown',
      avatar_url: ticket.avatar_url,
    },
  }));

  const ticketIds = allTickets.map((ticket) => ticket.id);
  const unreadByTicket = new Map<string, number>();
  const awaitingReplyByTicket = new Map<string, boolean>();
  const seenNoReplyByTicket = new Map<string, boolean>();
  const awaitingAdminReplyByTicket = new Map<string, boolean>();
  const adminSeenNoReplyByTicket = new Map<string, boolean>();

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
      const senderRole = userRoleSchema.parse(profiles?.role);
      
      const rawReads = message.support_message_reads || [];
      const reads = Array.isArray(rawReads) ? rawReads : [rawReads];

      const adminHasRead = reads.some((r) => r.reader_id === user.id);

      if (senderRole !== 'admin' && !adminHasRead) {
        unreadByTicket.set(ticketId, 1);
      }

      const ticket = allTickets.find((t) => t.id === ticketId);
      const ticketUserId = ticket?.user_id;

      const awaitingUserReply = senderRole === 'admin';
      const awaitingAdminReply = senderRole !== 'admin';

      awaitingReplyByTicket.set(ticketId, awaitingUserReply);

      const userHasSeen = reads.some((r) => r.reader_id === ticketUserId);
      seenNoReplyByTicket.set(ticketId, awaitingUserReply && userHasSeen);

      awaitingAdminReplyByTicket.set(ticketId, awaitingAdminReply);
      adminSeenNoReplyByTicket.set(ticketId, awaitingAdminReply && adminHasRead);
    });
  }

  const ticketsWithSignals = allTickets.map((ticket) => {
    const isActive = ACTIVE_TICKET_STATUSES.includes(ticket.status);
    return {
      ...ticket,
      unread_count: unreadByTicket.get(ticket.id) || 0,
      awaiting_user_reply:
        isActive && (awaitingReplyByTicket.get(ticket.id) || false),
      user_seen_no_reply:
        isActive && (seenNoReplyByTicket.get(ticket.id) || false),
      awaiting_admin_reply:
        isActive && (awaitingAdminReplyByTicket.get(ticket.id) || false),
      admin_seen_no_reply:
        isActive && (adminSeenNoReplyByTicket.get(ticket.id) || false),
    };
  });

  const activeQueue = ticketsWithSignals.filter((ticket) =>
    ACTIVE_TICKET_STATUSES.includes(ticket.status),
  );
  const resolvedQueue = ticketsWithSignals.filter((ticket) =>
    RESOLVED_TICKET_STATUSES.includes(ticket.status),
  );
  const selectedTickets =
    selectedTab === 'active' ? activeQueue : resolvedQueue;

  return (
    <div className='max-w-6xl mx-auto py-8 px-4'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Support Queue</h1>
          <p className='text-muted-foreground mt-1'>
            Priority = age (days waiting) + bump points (+10 per bump).
          </p>
        </div>
      </div>

      <div className='mb-6 inline-flex items-center rounded-lg border bg-muted/40 p-1'>
        <Link
          href='/support-admin?tab=active'
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            selectedTab === 'active'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Active ({activeQueue.length})
        </Link>
        <Link
          href='/support-admin?tab=resolved'
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            selectedTab === 'resolved'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Resolved ({resolvedQueue.length})
        </Link>
      </div>

      {selectedTab === 'active' ? (
        <section className='space-y-3'>
          <div>
            <h2 className='text-lg font-semibold'>Active Queue</h2>
            <p className='text-sm text-muted-foreground'>
              Open and in-progress tickets, sorted by total urgency.
            </p>
          </div>

          {selectedTickets.length > 0 ? (
            <AdminTicketList tickets={selectedTickets} />
          ) : (
            <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
              No active tickets right now.
            </div>
          )}
        </section>
      ) : (
        <section className='space-y-3'>
          <div>
            <h2 className='text-lg font-semibold'>Resolved & Closed</h2>
            <p className='text-sm text-muted-foreground'>
              Completed tickets for reference.
            </p>
          </div>

          {selectedTickets.length > 0 ? (
            <AdminTicketList tickets={selectedTickets} />
          ) : (
            <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
              No resolved tickets yet.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
