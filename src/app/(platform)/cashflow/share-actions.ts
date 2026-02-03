'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';

export async function togglePublic(cashflowId: string, isPublic: boolean) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const { error } = await supabase
    .from('cashflows')
    .update({ is_public: isPublic })
    .eq('id', cashflowId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to update public status:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  return { success: true };
}

export async function inviteUser(
  cashflowId: string,
  email: string,
  role: 'read' | 'edit' = 'read',
) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  // First verify ownership - only owner can invite
  const { data: cashflow, error: checkError } = await supabase
    .from('cashflows')
    .select('id')
    .eq('id', cashflowId)
    .eq('user_id', user.id)
    .single();

  if (checkError || !cashflow) {
    return { error: 'Only the owner can invite users' };
  }

  const { error } = await supabase.from('cashflow_shares').upsert(
    {
      cashflow_id: cashflowId,
      email: email.toLowerCase().trim(),
      role,
    },
    {
      onConflict: 'cashflow_id,email',
    },
  );

  if (error) {
    console.error('Failed to invite user:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  return { success: true };
}

export async function removeShare(shareId: string) {
  const { supabase } = await getAuthenticatedUserAndProfile();

  // RLS ensures only the owner (via cashflow ownership) or the shared user can delete the share
  const { error } = await supabase
    .from('cashflow_shares')
    .delete()
    .eq('id', shareId);

  if (error) {
    console.error('Failed to remove share:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function updateShareRole(shareId: string, role: 'read' | 'edit') {
  const { supabase } = await getAuthenticatedUserAndProfile();

  const { error } = await supabase
    .from('cashflow_shares')
    .update({ role })
    .eq('id', shareId);

  if (error) {
    console.error('Failed to update share role:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function getShares(cashflowId: string) {
  const { supabase } = await getAuthenticatedUserAndProfile();

  const { data, error } = await supabase
    .from('cashflow_shares')
    .select('*')
    .eq('cashflow_id', cashflowId);

  if (error) {
    console.error('Failed to get shares:', error);
    return { error: error.message };
  }

  return { data };
}

export async function subscribeToPublicCashflow(cashflowId: string) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  if (!user.email) {
    return { error: 'You must be logged in to bookmark a cashflow' };
  }

  // Double check cashflow is public
  const { data: cashflow } = await supabase
    .from('cashflows')
    .select('is_public')
    .eq('id', cashflowId)
    .single();

  if (!cashflow?.is_public) {
    return { error: 'This cashflow is not public' };
  }

  const { data, error } = await supabase
    .from('cashflow_shares')
    .upsert(
      {
        cashflow_id: cashflowId,
        email: user.email, // Matches default RLS
        role: 'read',
        created_via_public_access: true,
        is_included_in_totals: false, // Default to not included
      },
      {
        onConflict: 'cashflow_id,email',
        ignoreDuplicates: true, // If already shared, do nothing (don't overwrite explicit invites)
      },
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to bookmark cashflow:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  return { success: true, data };
}
