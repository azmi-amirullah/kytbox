'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

  const { error } = await supabase
    .from('support_tickets')
    .update({ status: newStatus })
    .eq('id', ticketId);

  if (error) {
    console.error('Error updating ticket status:', error);
    return { error: 'Failed to update status' };
  }

  revalidatePath(`/support-admin/${ticketId}`);
  revalidatePath(`/support-admin`);
  return { success: true };
}
