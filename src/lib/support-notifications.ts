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
    .select(`
      id,
      support_messages (
        profiles!support_messages_sender_id_fkey(role),
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
    const messages = ticket.support_messages || [];
    const lastMsgRaw = Array.isArray(messages) ? messages[0] : messages;

    let lastMsg = null;
    if (lastMsgRaw) {
      const profiles = Array.isArray(lastMsgRaw.profiles)
        ? lastMsgRaw.profiles[0]
        : lastMsgRaw.profiles;
      const role = userRoleSchema.parse(profiles?.role);
      
      const rawReads = lastMsgRaw.support_message_reads || [];
      const readsArray = Array.isArray(rawReads) ? rawReads : [rawReads];

      lastMsg = {
        role,
        reads: readsArray,
      };
    }

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
