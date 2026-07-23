'use server';

import { getAuthenticatedUserWithRateLimit as getAuthenticatedUser } from '@/lib/auth-with-rate-limit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  supportTicketSchema,
  replyTicketSchema,
  userRoleSchema,
} from './schemas.server';

export type State = {
  error?: string | null;
  success?: boolean;
  issues?: z.core.$ZodIssue[];
};

export async function createTicket(prevState: State, formData: FormData) {
  const { supabase } = await getAuthenticatedUser();

  const validatedFields = supportTicketSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
      issues: validatedFields.error.issues,
    };
  }

  const { subject, category, message } = validatedFields.data;

  const { data: ticketId, error: ticketError } = await supabase.rpc(
    'create_support_ticket',
    {
      p_subject: subject,
      p_category: category,
      p_message: message,
    },
  );

  if (ticketError || !ticketId) {
    console.error('Error creating ticket:', ticketError);
    return { error: 'Failed to create ticket' };
  }

  revalidatePath('/support');
  redirect(`/support/${ticketId}`);
}

import { createNotification } from '@/features/notifications';

export async function replyToTicket(
  ticketId: string,
  prevState: State,
  formData: FormData,
) {
  const { user, supabase } = await getAuthenticatedUser();

  const validatedFields = replyTicketSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
      issues: validatedFields.error.issues,
      success: false,
    };
  }

  const { message } = validatedFields.data;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const isAdmin = userRoleSchema.parse(profile?.role) === 'admin';

  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: user.id,
    message,
  });

  if (error) {
    console.error('Error replying to ticket:', error);
    return { error: 'Failed to send reply', success: false };
  }

  if (isAdmin) {
    const { error: statusError } = await supabase
      .from('support_tickets')
      .update({ status: 'in_progress' })
      .eq('id', ticketId)
      .eq('status', 'open');

    if (statusError) {
      console.error('Error auto-updating ticket status:', statusError);
    }

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id, subject')
      .eq('id', ticketId)
      .single();

    if (ticket && ticket.user_id !== user.id) {
      await createNotification({
        userId: ticket.user_id,
        type: 'support_reply',
        title: 'Support replied',
        body: `Re: ${ticket.subject}`,
        linkUrl: `/support/${ticketId}`,
      });
    }
  }

  revalidatePath('/support');
  revalidatePath('/support-admin');
  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/support-admin/${ticketId}`);
  return { error: '', success: true };
}

export async function bumpUrgency(ticketId: string) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase.rpc('bump_support_ticket_urgency', {
    p_ticket_id: ticketId,
  });

  if (error) {
    if (error.message.includes('24 hours')) {
      return { error: 'You can only bump urgency once every 24 hours.' };
    }
    if (error.message.includes('Ticket not found')) {
      return { error: 'Ticket not found' };
    }
    if (error.message.includes('Unauthorized')) {
      return { error: 'Unauthorized' };
    }
    if (error.message.includes('already closed')) {
      return { error: 'This ticket is already closed.' };
    }
    return { error: 'Failed to bump urgency' };
  }

  revalidatePath(`/support/${ticketId}`);
  revalidatePath('/support-admin');
  return { success: true };
}
