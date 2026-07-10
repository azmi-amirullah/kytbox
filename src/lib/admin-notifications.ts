import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { userRoleSchema } from '@/lib/validation.schemas';

/**
 * Returns count of active support tickets that need admin attention.
 * Only counts tickets where the last message is from a non-admin user
 * (or tickets with no messages yet — brand new).
 * Tickets where admin replied last are excluded.
 */
export async function getAdminTicketSummary(): Promise<{
  needsAttentionCount: number;
}> {
  const supabase = await createClient();

  const { data: tickets, error: ticketsError } = await supabase
    .from('support_tickets')
    .select('id')
    .in('status', ['open', 'in_progress']);

  if (ticketsError || !tickets || tickets.length === 0) {
    return { needsAttentionCount: 0 };
  }

  const ticketIds = tickets.map((t) => t.id);

  const { data: messages } = await supabase
    .from('support_messages')
    .select('ticket_id, profiles(role)')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: true });

  // Last entry per ticket_id wins (ascending order → last forEach write = newest)
  const lastSenderByTicket = new Map<string, string>();
  (messages || []).forEach((msg) => {
    const role = userRoleSchema.parse(msg.profiles?.role);
    lastSenderByTicket.set(msg.ticket_id, role);
  });


  let needsAttentionCount = 0;
  for (const ticket of tickets) {
    const lastSenderRole = lastSenderByTicket.get(ticket.id);
    // undefined = no messages yet, anything !== 'admin' = user sent last
    if (lastSenderRole !== 'admin') {
      needsAttentionCount++;
    }
  }

  return { needsAttentionCount };
}
