'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRateLimit as getAuthenticatedUser } from '@/lib/auth-with-rate-limit';

export async function togglePublic(cashflowId: string, isPublic: boolean) {
  const { user, supabase } = await getAuthenticatedUser();

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
  const { user, supabase } = await getAuthenticatedUser();

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
      is_pinned: true, // Auto-pin when invited
      is_included_in_totals: true, // Show in totals by default
      created_via_public_access: false, // Ensure they show up in management list
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
  const { user, supabase } = await getAuthenticatedUser();

  // Fetch share to check ownership/target and type
  const { data: share } = await supabase
    .from('cashflow_shares')
    .select('email, cashflow_id, created_via_public_access')
    .eq('id', shareId)
    .single();

  if (!share) return { error: 'Share not found' };

  // If the user removing the share is the one it belongs to (removing from their own dashboard)
  if (share.email.toLowerCase() === user.email?.toLowerCase()) {
    if (share.created_via_public_access) {
      // It was a guest bookmark. Fully delete it to revoke their access.
      const { error } = await supabase
        .from('cashflow_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        console.error('Failed to remove public share:', error);
        return { error: error.message };
      }
    } else {
      // It was an explicit invite. Just unpin it from the dashboard.
      const { error } = await supabase
        .from('cashflow_shares')
        .update({
          is_pinned: false,
          is_included_in_totals: false,
        })
        .eq('id', shareId);

      if (error) {
        console.error('Failed to unpin share:', error);
        return { error: error.message };
      }
    }
  } else {
    // Verify the current user owns the cashflow before allowing deletion
    const { data: cashflow } = await supabase
      .from('cashflows')
      .select('id')
      .eq('id', share.cashflow_id)
      .eq('user_id', user.id)
      .single();

    if (!cashflow) {
      return { error: 'Only the cashflow owner can remove shares' };
    }

    const { error } = await supabase
      .from('cashflow_shares')
      .delete()
      .eq('id', shareId);

    if (error) {
      console.error('Failed to remove share:', error);
      return { error: error.message };
    }
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function updateShareRole(shareId: string, role: 'read' | 'edit') {
  const { user, supabase } = await getAuthenticatedUser();

  // First fetch the share to get its associated cashflow ID
  const { data: share } = await supabase
    .from('cashflow_shares')
    .select('cashflow_id')
    .eq('id', shareId)
    .single();

  if (!share) return { error: 'Share not found' };

  // Verify that the current user owns the cashflow
  const { data: cashflow, error: ownershipError } = await supabase
    .from('cashflows')
    .select('id')
    .eq('id', share.cashflow_id)
    .eq('user_id', user.id)
    .single();

  if (ownershipError || !cashflow) {
    return { error: 'Only the cashflow owner can update roles' };
  }

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
  const { supabase } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('cashflow_shares')
    .select('*')
    .eq('cashflow_id', cashflowId)
    .or('created_via_public_access.eq.false,role.eq.edit'); // Show invited users OR anyone with edit access

  if (error) {
    console.error('Failed to get shares:', error);
    return { error: error.message };
  }

  return { data };
}

export async function subscribeToPublicCashflow(cashflowId: string) {
  const { user, supabase } = await getAuthenticatedUser();

  if (!user.email) {
    return { error: 'You must be logged in to bookmark a cashflow' };
  }

  // Double check cashflow is public and ownership
  const { data: cashflow } = await supabase
    .from('cashflows')
    .select('is_public, user_id')
    .eq('id', cashflowId)
    .single();

  if (!cashflow) {
    return { error: 'Cashflow not found' };
  }

  if (cashflow.user_id === user.id) {
    return { error: 'You cannot bookmark your own cashflow' };
  }

  // Check if they already have a share record (invitation or previous guest bookmark)
  const { data: existingShare } = await supabase
    .from('cashflow_shares')
    .select('id, created_via_public_access')
    .eq('cashflow_id', cashflowId)
    .eq('email', user.email.toLowerCase())
    .maybeSingle();

  let result;
  if (existingShare) {
    // Re-pinning an existing invite is always allowed (even for private cashflows).
    // Re-pinning a public guest bookmark requires the cashflow to still be public.
    if (existingShare.created_via_public_access && !cashflow.is_public) {
      return { error: 'This cashflow is no longer public' };
    }

    result = await supabase
      .from('cashflow_shares')
      .update({
        is_pinned: true,
        is_included_in_totals: true,
      })
      .eq('id', existingShare.id)
      .select()
      .single();
  } else {
    // New subscription requires the cashflow to be public
    if (!cashflow.is_public) {
      return { error: 'This cashflow is not public' };
    }

    result = await supabase
      .from('cashflow_shares')
      .insert({
        cashflow_id: cashflowId,
        email: user.email.toLowerCase(),
        is_pinned: true,
        is_included_in_totals: true,
        created_via_public_access: true,
      })
      .select()
      .single();
  }

  const { data, error } = result;

  if (error) {
    console.error('Failed to bookmark cashflow:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  return { success: true, data };
}
