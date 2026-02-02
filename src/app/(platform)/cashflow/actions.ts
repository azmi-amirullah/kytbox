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

  revalidatePath('/app/cashflow', 'page');
  return { success: true };
}

export async function updateCashflow(cashflowId: string, formData: FormData) {
  const { user, supabase } = await getAuthenticatedUserAndProfile();

  const title = formData.get('title') as string;

  if (!title?.trim()) {
    return { error: 'Title is required' };
  }

  const { error } = await supabase
    .from('cashflows')
    .update({ title: title.trim() })
    .eq('id', cashflowId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to update cashflow:', error);
    return { error: error.message };
  }

  revalidatePath('/app/cashflow', 'page');
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

  revalidatePath('/app/cashflow', 'page');
  return { success: true };
}

export async function addEntry(formData: FormData) {
  const { supabase } = await getAuthenticatedUserAndProfile();

  const cashflowId = formData.get('cashflowId') as string;
  const description = formData.get('description') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const type = formData.get('type') as 'income' | 'expense';
  const date = formData.get('date') as string;

  if (!description?.trim()) {
    return { error: 'Description is required' };
  }

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  if (!['income', 'expense'].includes(type)) {
    return { error: 'Invalid type' };
  }

  const { error } = await supabase.from('cashflow_entries').insert({
    cashflow_id: cashflowId,
    description: description.trim(),
    amount,
    type,
    date: date || new Date().toISOString().split('T')[0],
  });

  if (error) {
    console.error('Failed to add entry:', error);
    return { error: error.message };
  }

  revalidatePath('/app/cashflow', 'page');
  return { success: true };
}

export async function updateEntry(entryId: string, formData: FormData) {
  const { supabase } = await getAuthenticatedUserAndProfile();

  const description = formData.get('description') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const type = formData.get('type') as 'income' | 'expense';
  const date = formData.get('date') as string;

  if (!description?.trim()) {
    return { error: 'Description is required' };
  }

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  if (!['income', 'expense'].includes(type)) {
    return { error: 'Invalid type' };
  }

  const { error } = await supabase
    .from('cashflow_entries')
    .update({
      description: description.trim(),
      amount,
      type,
      date,
    })
    .eq('id', entryId);

  if (error) {
    console.error('Failed to update entry:', error);
    return { error: error.message };
  }

  revalidatePath('/app/cashflow', 'page');
  return { success: true };
}

export async function deleteEntry(entryId: string) {
  const { supabase } = await getAuthenticatedUserAndProfile();

  const { error } = await supabase
    .from('cashflow_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('Failed to delete entry:', error);
    return { error: error.message };
  }

  revalidatePath('/app/cashflow', 'page');
  return { success: true };
}
