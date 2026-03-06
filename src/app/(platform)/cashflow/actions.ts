'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';
import { z } from 'zod';
import { cashflowEntrySchema, updateCashflowEntrySchema } from '@/lib/schemas';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Extracts user_id from Supabase joined relation (e.g. cashflows(user_id))
const joinedOwnerSchema = z
  .object({ user_id: z.string() })
  .nullish()
  .transform((v) => v?.user_id);

export async function createCashflow(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = z
    .object({ title: z.string().min(1, 'Title is required') })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const title = parsed.data.title;

  const { error } = await supabase.from('cashflows').insert({
    user_id: user.id,
    title: title.trim(),
  });

  if (error) {
    console.error('Failed to create cashflow:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function updateCashflow(cashflowId: string, formData: FormData) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const parsed = z
    .object({ title: z.string().min(1, 'Title is required') })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const title = parsed.data.title;

  // Explicitly check ownership before update (though RLS handles it, this is clearer)
  const { error } = await supabase
    .from('cashflows')
    .update({ title: title.trim() })
    .eq('id', cashflowId)
    .eq('user_id', user.id); // Redundant if RLS behaves, but safe

  if (error) {
    console.error('Failed to update cashflow:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function deleteCashflow(cashflowId: string) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const { error } = await supabase
    .from('cashflows')
    .delete()
    .eq('id', cashflowId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete cashflow:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

/**
 * Internal helper to verify if a user has edit permissions for a cashflow.
 * A user can edit if they are the owner OR have a share with the 'edit' role.
 */
async function checkEditPermission(
  supabase: SupabaseClient<Database>,
  cashflowId: string,
  user: { id: string; email?: string },
  cachedOwnerId?: string,
) {
  // 1. If we already have the ownerId (from a join), check it first
  if (cachedOwnerId) {
    if (cachedOwnerId === user.id) return { canEdit: true };

    // Otherwise check for 'edit' share
    const { data: share } = await supabase
      .from('cashflow_shares')
      .select('role')
      .eq('cashflow_id', cashflowId)
      .eq('email', user.email?.toLowerCase() || '')
      .eq('role', 'edit')
      .single();

    return share
      ? { canEdit: true }
      : {
          canEdit: false,
          error: 'You do not have permission to edit this cashflow',
        };
  }

  // 2. Fallback: Check owner and shares in parallel
  const [ownerRes, shareRes] = await Promise.all([
    supabase.from('cashflows').select('user_id').eq('id', cashflowId).single(),
    supabase
      .from('cashflow_shares')
      .select('role')
      .eq('cashflow_id', cashflowId)
      .eq('email', user.email?.toLowerCase() || '')
      .eq('role', 'edit')
      .single(),
  ]);

  if (ownerRes.data?.user_id === user.id || shareRes.data) {
    return { canEdit: true };
  }

  return {
    canEdit: false,
    error: ownerRes.error
      ? 'Cashflow not found'
      : 'You do not have permission to edit this cashflow',
  };
}

export async function addEntry(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const formDataObj = Object.fromEntries(formData);
  const parsed = updateCashflowEntrySchema.safeParse(formDataObj);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { cashflowId, description, type, category, date, amount } = parsed.data;

  // Verify access (owner or editor)
  const permission = await checkEditPermission(supabase, cashflowId, user);
  if (!permission.canEdit) {
    return { error: permission.error || 'Access denied' };
  }

  const { error } = await supabase.from('cashflow_entries').insert({
    cashflow_id: cashflowId,
    description: description.trim(),
    amount,
    type,
    category: category ?? null,
    // Use provided date or fallback to UTC date string, but client should usually provide it.
    // Ideally we require date to ensure timezone accuracy.
    date: date || new Date().toISOString().split('T')[0],
  });

  if (error) {
    console.error('Failed to add entry:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function updateEntry(entryId: string, formData: FormData) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const formDataObj = Object.fromEntries(formData);
  const parsed = cashflowEntrySchema.safeParse(formDataObj);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { description, type, category, date, amount } = parsed.data;

  // Verify entry exists
  const { data: entry } = await supabase
    .from('cashflow_entries')
    .select('cashflow_id, cashflows(user_id)')
    .eq('id', entryId)
    .single();

  if (!entry) {
    return { error: 'Entry not found' };
  }

  // Verify permission
  const permission = await checkEditPermission(
    supabase,
    entry.cashflow_id,
    user,
    joinedOwnerSchema.parse(entry.cashflows),
  );
  if (!permission.canEdit) {
    return { error: permission.error || 'Access denied' };
  }

  const { error } = await supabase
    .from('cashflow_entries')
    .update({
      description: description.trim(),
      amount,
      type,
      category: category ?? null,
      date,
    })
    .eq('id', entryId);

  if (error) {
    console.error('Failed to update entry:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function deleteEntry(entryId: string) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  // Verify entry exists
  const { data: entry } = await supabase
    .from('cashflow_entries')
    .select('cashflow_id, cashflows(user_id)')
    .eq('id', entryId)
    .single();

  if (!entry) {
    return { error: 'Entry not found' };
  }

  // Verify permission
  const permission = await checkEditPermission(
    supabase,
    entry.cashflow_id,
    user,
    joinedOwnerSchema.parse(entry.cashflows),
  );
  if (!permission.canEdit) {
    return { error: permission.error || 'Access denied' };
  }

  const { error } = await supabase
    .from('cashflow_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('Failed to delete entry:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function toggleCashflowInclusion(
  cashflowId: string,
  isIncluded: boolean,
) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  if (!user.email) {
    return { error: 'User email required' };
  }

  // Check if share already exists to avoid overwriting creation source
  const { data: existingShare } = await supabase
    .from('cashflow_shares')
    .select('id')
    .eq('cashflow_id', cashflowId)
    .eq('email', user.email.toLowerCase())
    .single();

  let error;

  if (existingShare) {
    // Just update the preference
    const result = await supabase
      .from('cashflow_shares')
      .update({ is_included_in_totals: isIncluded })
      .eq('id', existingShare.id);
    error = result.error;
  } else {
    // Creating new share via public access
    // MUST explicitly check if cashflow is public before creating a public share
    const { data: cashflow } = await supabase
      .from('cashflows')
      .select('is_public')
      .eq('id', cashflowId)
      .single();

    if (!cashflow || !cashflow.is_public) {
      return { error: 'Access denied: Cashflow is not public' };
    }

    const result = await supabase.from('cashflow_shares').insert({
      cashflow_id: cashflowId,
      email: user.email.toLowerCase(),
      is_included_in_totals: isIncluded,
      role: 'read',
      is_pinned: true, // Auto-pin when toggling inclusion from public view
      created_via_public_access: true,
    });
    error = result.error;
  }

  if (error) {
    console.error('Failed to update inclusion status:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}
