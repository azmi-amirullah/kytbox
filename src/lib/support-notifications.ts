import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { userRoleSchema } from '@/lib/validation.schemas';

/**
 * Returns count of active support tickets that need attention.
 *
 * - For admins: counts tickets where the last message is from a non-admin user
 *   (or tickets with no messages yet).
 * - For users: counts tickets where the last message is from an admin AND
 *   the user has not read it yet.
 */
export async function getSupportTicketSummary(
  userId: string,
  isAdmin: boolean,
): Promise<{
  needsAttentionCount: number;
}> {
  const supabase = await createClient();

  const query = supabase
    .from('support_tickets')
    .select('id')
    .in('status', ['open', 'in_progress']);

  // If regular user, only look at their own tickets
  if (!isAdmin) {
    query.eq('user_id', userId);
  }

  const { data: tickets, error: ticketsError } = await query;

  if (ticketsError || !tickets || tickets.length === 0) {
    return { needsAttentionCount: 0 };
  }

  const ticketIds = tickets.map((t) => t.id);

  const { data: messages } = await supabase
    .from('support_messages')
    .select(
      'id, ticket_id, profiles!support_messages_sender_id_fkey(role), support_message_reads(reader_id)',
    )
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: true });

  // Last entry per ticket_id wins (ascending order → last forEach write = newest)
  const lastMessageByTicket = new Map<
    string,
    {
      role: string;
      reads: { reader_id: string }[];
    }
  >();

  (messages || []).forEach((msg) => {
    // Note: If using strict foreign key parsing, profiles might be an array or single.
    // In our schema it's typically a single object.
    const profiles = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
    const role = userRoleSchema.parse(profiles?.role);
    lastMessageByTicket.set(msg.ticket_id, {
      role,
      reads: msg.support_message_reads || [],
    });
  });

  let needsAttentionCount = 0;
  for (const ticket of tickets) {
    const lastMsg = lastMessageByTicket.get(ticket.id);

    if (isAdmin) {
      // Admin: needs attention if last message was NOT from an admin (or no messages)
      if (!lastMsg || lastMsg.role !== 'admin') {
        needsAttentionCount++;
      }
    } else {
      // User: needs attention if last message was from admin AND user hasn't read it
      if (lastMsg && lastMsg.role === 'admin') {
        const userHasRead = lastMsg.reads.some((r) => r.reader_id === userId);
        if (!userHasRead) {
          needsAttentionCount++;
        }
      }
    }
  }

  return { needsAttentionCount };
}
