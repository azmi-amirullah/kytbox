'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserAndProfile } from '@/lib/auth';

export async function createCashflow(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const title = formData.get('title') as string;

  if (!title?.trim()) {
    return { error: 'Title is required' };
  }

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

  const title = formData.get('title') as string;

  if (!title?.trim()) {
    return { error: 'Title is required' };
  }

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

export async function addEntry(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const cashflowId = formData.get('cashflowId') as string;
  const description = formData.get('description') as string;
  const amountStr = formData.get('amount') as string;
  const type = formData.get('type') as 'income' | 'expense';
  const date = formData.get('date') as string;

  if (!description?.trim()) {
    return { error: 'Description is required' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  if (!['income', 'expense'].includes(type)) {
    return { error: 'Invalid type' };
  }

  // Verify access (owner or editor)
  const { data: cashflow, error: checkError } = await supabase
    .from('cashflows')
    .select('id, user_id')
    .eq('id', cashflowId)
    .single();

  if (checkError || !cashflow) {
    return { error: 'Cashflow not found or access denied' };
  }

  // Check if owner or has edit role in shares
  let canEdit = cashflow.user_id === user.id;

  if (!canEdit) {
    const { data: share } = await supabase
      .from('cashflow_shares')
      .select('role')
      .eq('cashflow_id', cashflowId)
      .eq('email', user.email?.toLowerCase() || '')
      .eq('role', 'edit')
      .single();

    if (share) canEdit = true;
  }

  if (!canEdit) {
    return {
      error: 'You do not have permission to add entries to this cashflow',
    };
  }

  const { error } = await supabase.from('cashflow_entries').insert({
    cashflow_id: cashflowId,
    description: description.trim(),
    amount,
    type,
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
  const { supabase } = await getAuthenticatedUserAndProfile();

  const description = formData.get('description') as string;
  const amountStr = formData.get('amount') as string;
  const type = formData.get('type') as 'income' | 'expense';
  const date = formData.get('date') as string;

  if (!description?.trim()) {
    return { error: 'Description is required' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  if (!['income', 'expense'].includes(type)) {
    return { error: 'Invalid type' };
  }

  // Explicit ownership check via join could be complex, but we can trust RLS or do a pre-check.
  // We'll trust RLS for the update, but catch '0 rows updated' if we want strictly better UX.
  // However, simpler is often better. Let's add a robust RLS policy backing.
  // For extra safety, we can check if the entry belongs to a cashflow owned by the user.

  const { error } = await supabase
    .from('cashflow_entries')
    .update({
      description: description.trim(),
      amount,
      type,
      date,
    })
    .eq('id', entryId);
  // We implicitly rely on RLS here. If RLS is "user can update entries where cashflow.user_id = user.id", we are safe.
  if (error) {
    console.error('Failed to update entry:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function deleteEntry(entryId: string) {
  const { supabase } = await getAuthenticatedUserAndProfile();

  // RLS ensures we can only delete our own entries (via cashflow ownership)
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
    .eq('email', user.email)
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
    // This will error if cashflow is not public due to RLS, which is desired
    const result = await supabase.from('cashflow_shares').insert({
      cashflow_id: cashflowId,
      email: user.email,
      is_included_in_totals: isIncluded,
      role: 'read',
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
