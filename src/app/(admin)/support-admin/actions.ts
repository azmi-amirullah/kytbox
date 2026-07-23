'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { createNotification } from '@/features/notifications/server-utils';

export async function updateTicketStatus(
  ticketId: string,
  newStatus: 'open' | 'in_progress' | 'resolved' | 'closed',
) {
  const supabase = await createClient();

  // Verify Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('user_id, subject')
    .eq('id', ticketId)
    .single();

  const { error } = await supabase
    .from('support_tickets')
    .update({ status: newStatus })
    .eq('id', ticketId);

  if (error) {
    console.error('Error updating ticket status:', error);
    return { error: 'Failed to update status' };
  }

  if (ticket && ticket.user_id !== user.id) {
    await createNotification({
      userId: ticket.user_id,
      type: 'support_reply',
      title: 'Ticket Status Updated',
      body: `Status for ticket "${ticket.subject}" is now ${newStatus.replace('_', ' ')}`,
      linkUrl: `/support/${ticketId}`,
    });
  }

  revalidatePath(`/support-admin/${ticketId}`);
  revalidatePath(`/support-admin`);
  return { success: true };
}
