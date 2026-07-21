import 'server-only';

import { createClient } from '@/lib/supabase/server';

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
    .select(`
      id,
      user_id,
      status,
      support_messages (
        id,
        sender_id,
        support_message_reads(reader_id)
      )
    `)
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: false, foreignTable: 'support_messages' })
    .limit(1, { foreignTable: 'support_messages' });

  // If regular user, only look at their own tickets
  if (!isAdmin) {
    query.eq('user_id', userId);
  }

  const { data: tickets, error: ticketsError } = await query;

  if (ticketsError || !tickets || tickets.length === 0) {
    return { needsAttentionCount: 0 };
  }

  let needsAttentionCount = 0;
  for (const ticket of tickets) {
    const isOwnTicket = ticket.user_id === userId;
    const messages = ticket.support_messages || [];
    const lastMsgRaw = Array.isArray(messages) ? messages[0] : messages;

    if (!lastMsgRaw) {
      if (isAdmin && !isOwnTicket) {
        needsAttentionCount++;
      }
      continue;
    }

    const senderId = lastMsgRaw.sender_id;
    const rawReads = lastMsgRaw.support_message_reads || [];
    const readsArray = Array.isArray(rawReads) ? rawReads : [rawReads];
    const userHasRead = readsArray.some((r) => r.reader_id === userId);

    const isLastMessageFromCustomer = senderId === ticket.user_id;

    if (isAdmin) {
      // For Admins:
      // 1. Any open ticket where customer sent last message needs admin attention in queue
      // 2. Admin's own ticket where support agent replied and owner hasn't read it
      if (isLastMessageFromCustomer) {
        needsAttentionCount++;
      } else if (isOwnTicket && !userHasRead) {
        needsAttentionCount++;
      }
    } else {
      // For Regular Users:
      // Needs attention if support replied (!isLastMessageFromCustomer) AND user hasn't read it
      if (isOwnTicket && !isLastMessageFromCustomer && !userHasRead) {
        needsAttentionCount++;
      }
    }
  }

  return { needsAttentionCount };
}
