'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z, ZodIssue } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum(['general', 'bug', 'billing', 'feature_request', 'account']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type State = {
  error?: string | null;
  success?: boolean;
  issues?: ZodIssue[];
};

export async function createTicket(prevState: State, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = createTicketSchema.safeParse({
    subject: formData.get('subject'),
    category: formData.get('category'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields', issues: validatedFields.error.issues };
  }

  const { subject, category, message } = validatedFields.data;

  // 1. Create Ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject,
      category,
      status: 'open',
    })
    .select()
    .single();

  if (ticketError) {
    console.error('Error creating ticket:', ticketError);
    return { error: 'Failed to create ticket' };
  }

  // 2. Create Initial Message
  const { error: messageError } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      message,
    });

  if (messageError) {
    console.error('Error creating message:', messageError);
    return { error: 'Failed to create message' };
  }

  revalidatePath('/support');
  redirect(`/support/${ticket.id}`);
}

const replySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

export async function replyToTicket(
  ticketId: string,
  prevState: State,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', success: false };
  }

  const validatedFields = replySchema.safeParse({
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields',
      issues: validatedFields.error.issues,
      success: false,
    };
  }

  const { message } = validatedFields.data;

  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: user.id,
    message,
  });

  if (error) {
    console.error('Error replying to ticket:', error);
    return { error: 'Failed to send reply', success: false };
  }

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/support-admin/${ticketId}`);
  return { error: '', success: true };
}

export async function bumpUrgency(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Fetch ticket to check ownership and last bump
  const { data: ticket, error: fetchError } = await supabase
    .from('support_tickets')
    .select('user_id, last_bumped_at, urgency_score')
    .eq('id', ticketId)
    .single();

  if (fetchError || !ticket) return { error: 'Ticket not found' };
  if (ticket.user_id !== user.id) return { error: 'Unauthorized' };

  // Check 24h cooldown
  const now = new Date();
  if (ticket.last_bumped_at) {
    const lastBump = new Date(ticket.last_bumped_at);
    const diffHours = (now.getTime() - lastBump.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return { error: 'You can only bump urgency once every 24 hours.' };
    }
  }

  // Bump score: +10 points
  const { error: updateError } = await supabase
    .from('support_tickets')
    .update({
      urgency_score: (ticket.urgency_score || 0) + 10,
      last_bumped_at: now.toISOString(),
    })
    .eq('id', ticketId);

  if (updateError) return { error: 'Failed to bump urgency' };

  revalidatePath(`/support/${ticketId}`);
  return { success: true };
}
