'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createSplitGroupSchema,
  splitExpenseSchema,
} from './schemas.server';
import {
  mapSplitGroupToDTO,
  mapSplitExpenseToDTO,
} from '@/lib/mappers';
import { calculateNetBalances } from './lib/split-math';

/**
 * Creates a new zero-signup shared expense group.
 */
export async function createSplitGroupAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createSplitGroupSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, currency, honeypot } = parsed.data;
  if (honeypot && honeypot.length > 0) {
    return { error: 'Invalid submission' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Generate a friendly 10-char URL-safe token
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 10);

  const { data: group, error } = await supabase
    .from('cashflow_split_groups')
    .insert({
      token,
      title: title.trim(),
      currency: (currency || 'USD').toUpperCase(),
      creator_id: user?.id ?? null,
    })
    .select('*')
    .single();

  if (error || !group) {
    console.error('Failed to create split group:', error);
    return { error: error?.message || 'Failed to create group' };
  }

  return { success: true, token: group.token, groupId: group.id };
}

/**
 * Fetches split group and its expenses by public token.
 */
export async function getSplitGroupByTokenAction(token: string) {
  const supabase = await createClient();

  const { data: group, error: groupErr } = await supabase
    .from('cashflow_split_groups')
    .select('*')
    .eq('token', token)
    .single();

  if (groupErr || !group) {
    return { error: 'Group not found', notFound: true };
  }

  const { data: expenses, error: expErr } = await supabase
    .from('cashflow_split_group_expenses')
    .select('*')
    .eq('group_id', group.id)
    .order('created_at', { ascending: false });

  if (expErr) {
    console.error('Failed to fetch group expenses:', expErr);
    return { error: 'Failed to load expenses' };
  }

  const groupDTO = mapSplitGroupToDTO(group);
  const expensesDTO = (expenses || []).map(mapSplitExpenseToDTO);
  const mathResult = calculateNetBalances(expensesDTO);

  return {
    success: true,
    group: groupDTO,
    expenses: expensesDTO,
    mathResult,
  };
}

/**
 * Adds an expense to a split group.
 */
export async function addSplitExpenseAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const splitBetweenRaw = formData.getAll('split_between');

  const parsed = splitExpenseSchema.safeParse({
    ...raw,
    split_between:
      splitBetweenRaw.length > 0
        ? splitBetweenRaw
        : typeof raw.split_between === 'string'
        ? raw.split_between.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    groupId,
    deviceToken,
    description,
    amount,
    paid_by,
    split_between,
    is_settlement,
    honeypot,
  } = parsed.data;

  if (honeypot && honeypot.length > 0) {
    return { error: 'Invalid submission' };
  }

  const supabase = await createClient();

  // Verify group exists
  const { data: group } = await supabase
    .from('cashflow_split_groups')
    .select('id, token')
    .eq('id', groupId)
    .single();

  if (!group) {
    return { error: 'Group not found' };
  }

  const { data: insertedExpense, error } = await supabase
    .from('cashflow_split_group_expenses')
    .insert({
      group_id: groupId,
      device_token: deviceToken,
      description: description.trim(),
      amount,
      paid_by: paid_by.trim(),
      split_between: split_between.map((s) => s.trim()),
      is_settlement,
    })
    .select('*')
    .single();

  if (error || !insertedExpense) {
    console.error('Failed to insert split expense:', error);
    return { error: error?.message || 'Failed to record expense' };
  }

  revalidatePath(`/split/${group.token}`);
  return { success: true, expense: mapSplitExpenseToDTO(insertedExpense) };
}

/**
 * Deletes a split expense if the device token matches or user is group creator.
 */
export async function deleteSplitExpenseAction(input: {
  expenseId: string;
  deviceToken: string;
  token: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: expense } = await supabase
    .from('cashflow_split_group_expenses')
    .select('id, device_token, group_id')
    .eq('id', input.expenseId)
    .single();

  if (!expense) {
    return { error: 'Expense not found' };
  }

  const { data: group } = await supabase
    .from('cashflow_split_groups')
    .select('creator_id, token')
    .eq('id', expense.group_id)
    .single();

  const isDeviceOwner = expense.device_token === input.deviceToken;
  const isGroupCreator = Boolean(user && group && group.creator_id === user.id);

  if (!isDeviceOwner && !isGroupCreator) {
    return { error: 'You do not have permission to delete this expense' };
  }

  const { error } = await supabase
    .from('cashflow_split_group_expenses')
    .delete()
    .eq('id', input.expenseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/split/${input.token}`);
  return { success: true };
}
