'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRateLimit as getAuthenticatedUser } from '@/lib/auth-with-rate-limit';
import { getAuthenticatedUser as getAuthenticatedUserOnly } from '@/lib/auth';
import { actionRateLimit, checkRateLimit } from '@/lib/upstash/redis';
import { z } from 'zod';
import {
  cashflowEntrySchema,
  updateCashflowEntrySchema,
  cashflowSplitItemSchema,
  cashflowBudgetSchema,
  deleteCashflowBudgetSchema,
  generateRecurringSchema,
  cashflowGoalSchema,
  updateCashflowGoalSchema,
  deleteCashflowGoalSchema,
  getGoalEntryValidationError,
  shouldPreserveExistingGoalRelation,
} from './schemas.server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { mapBudgetToDTO, mapGoalToDTO } from '@/lib/mappers';
import { createNotification } from '@/features/notifications';
import { shiftToCurrentMonth } from './math';

// Extracts user_id from Supabase joined relation (e.g. cashflows(user_id))
const joinedOwnerSchema = z
  .object({ user_id: z.string() })
  .nullish()
  .transform((v) => v?.user_id);

async function checkBudgetThresholds(
  supabase: SupabaseClient<Database>,
  cashflowId: string,
  category: string,
  userId: string,
) {
  if (!category) return;

  const { data: budget } = await supabase
    .from('cashflow_budgets')
    .select('amount')
    .eq('cashflow_id', cashflowId)
    .eq('category', category)
    .maybeSingle();

  if (!budget || budget.amount <= 0) return;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1)).toISOString().split('T')[0];
  const monthEnd = new Date(Date.UTC(year, month + 1, 0)).toISOString().split('T')[0];

  const { data: entries } = await supabase
    .from('cashflow_entries')
    .select('amount')
    .eq('cashflow_id', cashflowId)
    .eq('category', category)
    .eq('type', 'expense')
    .gte('date', monthStart)
    .lte('date', monthEnd);

  const totalSpent = (entries || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
  const ratio = totalSpent / budget.amount;

  const targetType = ratio >= 1.0 ? 'budget_exceeded' : ratio >= 0.8 ? 'budget_warning' : null;
  if (!targetType) return;

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', targetType)
    .eq('link_url', `/cashflow/${cashflowId}`)
    .ilike('body', `%${category}%`)
    .gte('created_at', monthStart)
    .limit(1);

  if (existing && existing.length > 0) return;

  if (targetType === 'budget_exceeded') {
    const overage = (totalSpent - budget.amount).toFixed(2);
    await createNotification({
      userId,
      type: 'budget_exceeded',
      title: 'Budget Exceeded 🔴',
      body: `${category} is over budget by $${overage}`,
      linkUrl: `/cashflow/${cashflowId}`,
    });
  } else if (targetType === 'budget_warning') {
    const percentage = Math.round(ratio * 100);
    await createNotification({
      userId,
      type: 'budget_warning',
      title: 'Budget Warning ⚠️',
      body: `${category} reached ${percentage}% of $${budget.amount} budget`,
      linkUrl: `/cashflow/${cashflowId}`,
    });
  }
}

export async function createCashflow(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

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
  const { user, supabase } = await getAuthenticatedUser();

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
  const { user, supabase } = await getAuthenticatedUser();

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
      .eq('email', user.email?.trim().toLowerCase() || '')
      .eq('role', 'edit')
      .or('created_via_public_access.is.null,created_via_public_access.eq.false')
      .single();

    return share
      ? { canEdit: true }
      : {
          canEdit: false,
          error: 'You do not have permission to edit this cashflow',
        };
  }

  // 2. Fallback: Check owner first, then shares sequentially (optimizes the common owner path)
  const { data: cashflow } = await supabase
    .from('cashflows')
    .select('user_id')
    .eq('id', cashflowId)
    .single();

  if (!cashflow) {
    return {
      canEdit: false,
      error: 'Cashflow not found',
    };
  }

  if (cashflow.user_id === user.id) {
    return { canEdit: true };
  }

  const { data: share } = await supabase
    .from('cashflow_shares')
    .select('role')
    .eq('cashflow_id', cashflowId)
    .eq('email', user.email?.trim().toLowerCase() || '')
    .eq('role', 'edit')
    .or('created_via_public_access.is.null,created_via_public_access.eq.false')
    .single();

  if (share) {
    return { canEdit: true };
  }

  return {
    canEdit: false,
    error: 'You do not have permission to edit this cashflow',
  };
}

async function isCashflowOwner(
  supabase: SupabaseClient<Database>,
  cashflowId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('cashflows')
    .select('id')
    .eq('id', cashflowId)
    .eq('user_id', userId)
    .maybeSingle();

  return Boolean(data);
}

async function resolveGoalId(
  supabase: SupabaseClient<Database>,
  category: string | null | undefined,
  goalId: string | undefined,
): Promise<{ goalId: string | null; category: string | null; error?: string }> {
  if (goalId) {
    const { data: goal, error } = await supabase
      .from('cashflow_goals')
      .select('id, title')
      .eq('id', goalId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      console.error('cashflow_goal_resolution_failed', error);
      return {
        goalId: null,
        category: null,
        error: 'Unable to validate the savings goal',
      };
    }

    if (!goal) {
      return { goalId: null, category: null, error: 'Savings goal not found' };
    }

    if (
      category?.startsWith('Goal:') &&
      category.slice('Goal:'.length).trim() !== goal.title
    ) {
      return {
        goalId: null,
        category: null,
        error: 'Savings goal category does not match the selected goal',
      };
    }

    return { goalId: goal.id, category: `Goal: ${goal.title}` };
  }

  if (!category?.startsWith('Goal:')) {
    return { goalId: null, category: category ?? null };
  }

  const title = category.slice('Goal:'.length).trim();
  if (!title) {
    return {
      goalId: null,
      category: null,
      error: 'A savings goal must have a name',
    };
  }

  const { data: matchingGoals, error } = await supabase
    .from('cashflow_goals')
    .select('id, title')
    .eq('is_deleted', false)
    .eq('title', title);

  if (error) {
    console.error('cashflow_goal_resolution_failed', error);
    return {
      goalId: null,
      category: null,
      error: 'Unable to validate the savings goal',
    };
  }

  if (!matchingGoals || matchingGoals.length === 0) {
    return { goalId: null, category: null, error: 'Savings goal not found' };
  }

  if (matchingGoals.length > 1) {
    return {
      goalId: null,
      category: null,
      error: 'Multiple savings goals have this name. Select a goal from the category menu.',
    };
  }

  return {
    goalId: matchingGoals[0].id,
    category: `Goal: ${matchingGoals[0].title}`,
  };
}

export async function addEntry(formData: FormData) {
  // Plain auth — rate limit is handled below inside Promise.all
  const { user, supabase } = await getAuthenticatedUserOnly();

  const formDataObj = Object.fromEntries(formData);
  const parsed = updateCashflowEntrySchema.safeParse(formDataObj);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    cashflowId,
    goalId,
    description,
    type,
    category,
    date,
    amount,
    is_recurring,
    recurrence_interval,
    yearly_calculation,
  } = parsed.data;

  const goalEntryError = getGoalEntryValidationError(type, category);
  if (goalEntryError) return { error: goalEntryError };
  if (goalId && type !== 'expense') {
    return { error: 'Savings goal contributions must be expense entries' };
  }

  // Parallelize: rate limit + permission check + targeted recurring conflict check
  const [{ success: rateLimitOk }, permission, { data: latestSameSeries }] = await Promise.all([
    checkRateLimit(actionRateLimit, user.id),
    checkEditPermission(supabase, cashflowId, user),
    // Targeted: fetch only the latest entry for this exact name+type instead of all templates
    !is_recurring
      ? supabase
          .from('cashflow_entries')
          .select('is_recurring')
          .eq('cashflow_id', cashflowId)
          .eq('type', type)
          .ilike('description', description.trim())
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!rateLimitOk) throw new Error('Too many requests. Please slow down.');
  if (!permission.canEdit) return { error: permission.error || 'Access denied' };

  const resolvedGoal = await resolveGoalId(supabase, category, goalId);
  if (resolvedGoal.error) return { error: resolvedGoal.error };

  // Prevent accidental recurring series cancellation
  if (latestSameSeries?.is_recurring) {
    return { error: `A recurring series with name "${description.trim()}" is active. Please use a slightly different name for this manual entry to avoid conflicts.` };
  }

  let splitItems: { itemName: string; category?: string | null; amount: number }[] | null = null;
  if (parsed.data.itemsJson) {
    try {
      const rawJson = JSON.parse(parsed.data.itemsJson);
      const parsedItems = z.array(cashflowSplitItemSchema).safeParse(rawJson);
      if (parsedItems.success) {
        splitItems = parsedItems.data;
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  const finalAmount = splitItems && splitItems.length > 0
    ? Math.round(splitItems.reduce((acc, item) => acc + item.amount, 0) * 100) / 100
    : amount;

  const { data: insertedEntry, error } = await supabase
    .from('cashflow_entries')
    .insert({
      cashflow_id: cashflowId,
      goal_id: resolvedGoal.goalId,
      description: description.trim(),
      amount: finalAmount,
      type,
      category: resolvedGoal.category,
      date: date || new Date().toISOString().split('T')[0],
      is_recurring: is_recurring,
      recurrence_interval: is_recurring ? recurrence_interval : null,
      yearly_calculation:
        is_recurring && recurrence_interval === 'yearly'
          ? yearly_calculation
          : null,
    })
    .select('id')
    .single();

  if (error || !insertedEntry) {
    console.error('Failed to add entry:', error);
    return { error: error?.message || 'Failed to create entry' };
  }

  if (splitItems && splitItems.length > 0) {
    const splitRows = splitItems.map((item) => ({
      parent_entry_id: insertedEntry.id,
      item_name: item.itemName,
      category: item.category || null,
      amount: item.amount,
    }));
    const { error: splitError } = await supabase
      .from('cashflow_split_entries')
      .insert(splitRows);

    if (splitError) {
      console.error('Failed to insert split entries:', splitError);
    }
  }

  if (type === 'expense' && resolvedGoal.category) {
    await checkBudgetThresholds(supabase, cashflowId, resolvedGoal.category, user.id);
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function updateEntry(entryId: string, formData: FormData) {
  // Plain auth — rate limit is handled below inside Promise.all
  const { user, supabase } = await getAuthenticatedUserOnly();

  const formDataObj = Object.fromEntries(formData);
  const parsed = cashflowEntrySchema.safeParse(formDataObj);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    goalId,
    description,
    type,
    category,
    date,
    amount,
    is_recurring,
    recurrence_interval,
    yearly_calculation,
  } = parsed.data;

  const goalEntryError = getGoalEntryValidationError(type, category);
  if (goalEntryError) return { error: goalEntryError };
  if (goalId && type !== 'expense') {
    return { error: 'Savings goal contributions must be expense entries' };
  }

  // Batch 1: rate limit + entry fetch are independent — run in parallel
  const [{ success: rateLimitOk }, { data: entry }] = await Promise.all([
    checkRateLimit(actionRateLimit, user.id),
    supabase
      .from('cashflow_entries')
      .select('cashflow_id, goal_id, category, cashflows(user_id)')
      .eq('id', entryId)
      .single(),
  ]);

  if (!rateLimitOk) throw new Error('Too many requests. Please slow down.');
  if (!entry) return { error: 'Entry not found' };

  // Batch 2: permission check + targeted recurring conflict check are independent — run in parallel
  const [permission, { data: latestSameSeries }] = await Promise.all([
    checkEditPermission(
      supabase,
      entry.cashflow_id,
      user,
      joinedOwnerSchema.parse(entry.cashflows),
    ),
    // Targeted: fetch only the latest entry for this exact name+type instead of all templates.
    // Exclude the current entry (entryId) so editing a recurring entry doesn't block itself.
    !is_recurring
      ? supabase
          .from('cashflow_entries')
          .select('is_recurring')
          .eq('cashflow_id', entry.cashflow_id)
          .eq('type', type)
          .ilike('description', description.trim())
          .neq('id', entryId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!permission.canEdit) return { error: permission.error || 'Access denied' };

  const preserveExistingGoal = shouldPreserveExistingGoalRelation({
    existingGoalId: entry.goal_id,
    requestedGoalId: goalId,
    category,
    type,
  });
  const resolvedGoal = preserveExistingGoal
    ? { goalId: entry.goal_id, category: entry.category }
    : await resolveGoalId(supabase, category, goalId);
  if (resolvedGoal.error) return { error: resolvedGoal.error };

  // Prevent accidental recurring series cancellation
  if (latestSameSeries?.is_recurring) {
    return { error: `A recurring series with name "${description.trim()}" is active. Please use a slightly different name for this manual entry to avoid conflicts.` };
  }

  let splitItems: { itemName: string; category?: string | null; amount: number }[] | null = null;
  if (parsed.data.itemsJson) {
    try {
      const rawJson = JSON.parse(parsed.data.itemsJson);
      const parsedItems = z.array(cashflowSplitItemSchema).safeParse(rawJson);
      if (parsedItems.success) {
        splitItems = parsedItems.data;
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  const finalAmount = splitItems && splitItems.length > 0
    ? Math.round(splitItems.reduce((acc, item) => acc + item.amount, 0) * 100) / 100
    : amount;

  const { error } = await supabase
    .from('cashflow_entries')
    .update({
      description: description.trim(),
      amount: finalAmount,
      ...(preserveExistingGoal
        ? {}
        : {
            type,
            category: resolvedGoal.category,
            goal_id: resolvedGoal.goalId,
          }),
      date,
      is_recurring: is_recurring,
      recurrence_interval: is_recurring ? recurrence_interval : null,
      yearly_calculation:
        is_recurring && recurrence_interval === 'yearly'
          ? yearly_calculation
          : null,
    })
    .eq('id', entryId);

  if (error) {
    console.error('Failed to update entry:', error);
    return { error: error.message };
  }

  if (splitItems !== null) {
    await supabase
      .from('cashflow_split_entries')
      .delete()
      .eq('parent_entry_id', entryId);

    if (splitItems.length > 0) {
      const splitRows = splitItems.map((item) => ({
        parent_entry_id: entryId,
        item_name: item.itemName,
        category: item.category || null,
        amount: item.amount,
      }));
      const { error: splitError } = await supabase
        .from('cashflow_split_entries')
        .insert(splitRows);
      if (splitError) {
        console.error('Failed to update split entries:', splitError);
      }
    }
  }

  if (type === 'expense' && resolvedGoal.category) {
    await checkBudgetThresholds(
      supabase,
      entry.cashflow_id,
      resolvedGoal.category,
      user.id,
    );
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function deleteEntry(entryId: string) {
  const { user, supabase } = await getAuthenticatedUser();

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
  const { user, supabase } = await getAuthenticatedUser();

  if (!user.email) {
    return { error: 'User email required' };
  }

  // Check if share already exists to avoid overwriting creation source
  const { data: existingShare } = await supabase
    .from('cashflow_shares')
    .select('id')
    .eq('cashflow_id', cashflowId)
    .eq('email', user.email.trim().toLowerCase())
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
      email: user.email.trim().toLowerCase(),
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

export async function upsertBudget(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const parsed = cashflowBudgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { cashflowId, category, amount } = parsed.data;

  // Verify ownership — budgets are owner-only
  const { data: cashflow } = await supabase
    .from('cashflows')
    .select('user_id')
    .eq('id', cashflowId)
    .single();

  if (!cashflow || cashflow.user_id !== user.id) {
    return { error: 'Access denied' };
  }

  const { error } = await supabase.from('cashflow_budgets').upsert(
    {
      cashflow_id: cashflowId,
      category,
      amount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'cashflow_id,category' },
  );

  if (error) {
    console.error('Failed to upsert budget:', error);
    return { error: error.message };
  }

  await checkBudgetThresholds(supabase, cashflowId, category, user.id);

  revalidatePath('/cashflow');
  return { success: true };
}

export async function deleteBudget(budgetId: string) {
  const { user, supabase } = await getAuthenticatedUser();

  const parsed = deleteCashflowBudgetSchema.safeParse({ budgetId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Verify ownership via join
  const { data: budget } = await supabase
    .from('cashflow_budgets')
    .select('id, cashflows(user_id)')
    .eq('id', budgetId)
    .single();

  if (!budget) {
    return { error: 'Budget not found' };
  }

  const ownerId = joinedOwnerSchema.parse(budget.cashflows);
  if (ownerId !== user.id) {
    return { error: 'Access denied' };
  }

  const { error } = await supabase
    .from('cashflow_budgets')
    .delete()
    .eq('id', budgetId);

  if (error) {
    console.error('Failed to delete budget:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function getBudgets(cashflowId: string) {
  const { user, supabase } = await getAuthenticatedUser();

  // Owners can always see budgets; editors can read via RLS
  const { data: ownerCheck } = await supabase
    .from('cashflows')
    .select('user_id')
    .eq('id', cashflowId)
    .single();

  const isOwner = ownerCheck?.user_id === user.id;
  if (!isOwner) {
    const perm = await checkEditPermission(supabase, cashflowId, user);
    if (!perm.canEdit) {
      return { error: 'Access denied', data: null };
    }
  }

  const { data, error } = await supabase
    .from('cashflow_budgets')
    .select('*')
    .eq('cashflow_id', cashflowId)
    .order('category', { ascending: true });

  if (error) {
    console.error('Failed to fetch budgets:', error);
    return { error: error.message, data: null };
  }

  return { data: (data ?? []).map(mapBudgetToDTO), error: null };
}

// ==========================================
// SHARE ACTIONS
// ==========================================

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
    .eq('email', user.email.trim().toLowerCase())
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
        email: user.email.trim().toLowerCase(),
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

export async function generateRecurringEntries(
  cashflowId: string,
  targetYear?: number,
  targetMonth?: number,
  generatePast?: boolean
) {
  const parsed = generateRecurringSchema.safeParse({
    cashflowId,
    targetYear,
    targetMonth,
    generatePast,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { user, supabase } = await getAuthenticatedUser();

  // Verify ownership
  const { data: cashflow } = await supabase
    .from('cashflows')
    .select('id, user_id')
    .eq('id', cashflowId)
    .eq('user_id', user.id)
    .single();

  if (!cashflow) {
    return { error: 'Cashflow not found or access denied' };
  }

  // Get active templates via database RPC
  const { data: allEntries, error: fetchError } = await supabase
    .rpc('get_latest_recurring_templates', { p_cashflow_id: cashflowId });

  if (fetchError) {
    console.error('Failed to fetch entries:', fetchError);
    return { error: 'Failed to fetch entries' };
  }

  if (!allEntries || allEntries.length === 0) {
    return { generated: 0 };
  }

  const now = new Date();
  const currentMonth = targetMonth !== undefined ? targetMonth : now.getMonth();
  const currentYear = targetYear !== undefined ? targetYear : now.getFullYear();
  const currentMonthStart = new Date(currentYear, currentMonth, 1);

  // Active recurring series are those where the latest entry in the series is marked recurring
  // (allEntries from RPC is already grouped by description+type and sorted to have the latest entry)
  const uniqueRecurring = allEntries.filter((e) => {
    if (!e.is_recurring) return false;

    // Check if the template starts in the future relative to target month/year
    const [entryYear, entryMonthNumber] = e.date.split('-').map(Number);
    if (entryYear > currentYear || (entryYear === currentYear && entryMonthNumber - 1 > currentMonth)) {
      return false;
    }

    // If yearly, only generate in the anniversary month
    if (e.recurrence_interval === 'yearly' && entryMonthNumber - 1 !== currentMonth) {
      return false;
    }

    return true;
  });

  const recurringGoalTitles = new Map<string, string>();
  const recurringGoalIds = Array.from(
    new Set(
      uniqueRecurring
        .map((entry) => entry.goal_id)
        .filter((goalId): goalId is string => Boolean(goalId)),
    ),
  );
  if (recurringGoalIds.length > 0) {
    const { data: recurringGoals, error: recurringGoalsError } = await supabase
      .from('cashflow_goals')
      .select('id, title')
      .eq('is_deleted', false)
      .in('id', recurringGoalIds);

    if (recurringGoalsError) {
      console.error('Failed to fetch recurring goal labels:', recurringGoalsError);
      return { error: 'Failed to fetch recurring goal labels' };
    }

    for (const goal of recurringGoals ?? []) {
      recurringGoalTitles.set(goal.id, goal.title);
    }
  }

  const inaccessibleGoalIds = recurringGoalIds.filter(
    (goalId) => !recurringGoalTitles.has(goalId),
  );
  if (inaccessibleGoalIds.length > 0) {
    console.warn('cashflow_recurring_archived_goals_skipped', {
      goalIds: inaccessibleGoalIds,
    });
    const activeRecurring = uniqueRecurring.filter(
      (entry) => !entry.goal_id || recurringGoalTitles.has(entry.goal_id),
    );
    uniqueRecurring.splice(0, uniqueRecurring.length, ...activeRecurring);
  }

  const getRecurringCategory = (entry: (typeof uniqueRecurring)[number]) =>
    entry.goal_id
      ? recurringGoalTitles.has(entry.goal_id)
        ? `Goal: ${recurringGoalTitles.get(entry.goal_id)}`
        : null
      : entry.category?.startsWith('Goal:')
        ? null
        : entry.category;

  const formatLocalYYYYMMDD = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // If generating past entries
  if (parsed.data.generatePast) {
    // Find the earliest date among recurring series
    let earliestDateStr = formatLocalYYYYMMDD(currentYear, currentMonth, 1);
    for (const entry of uniqueRecurring) {
      if (entry.date < earliestDateStr) {
        earliestDateStr = entry.date;
      }
    }

    const [earliestYear, earliestMonth] = earliestDateStr.split('-').map(Number);
    const scanStart = formatLocalYYYYMMDD(earliestYear, earliestMonth - 1, 1);
    const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
    const currentMonthEnd = formatLocalYYYYMMDD(
      lastDayCurrentMonth.getFullYear(),
      lastDayCurrentMonth.getMonth(),
      lastDayCurrentMonth.getDate()
    );

    const { data: existingPastEntries, error: pastError } = await supabase
      .from('cashflow_entries')
      .select('description, type, amount, date')
      .eq('cashflow_id', cashflowId)
      .gte('date', scanStart)
      .lte('date', currentMonthEnd);

    if (pastError) {
      console.error('Failed to fetch existing past entries:', pastError);
      return { error: 'Failed to check past entries' };
    }

    const pastExistingSet = new Set(
      (existingPastEntries || []).map((e) => {
        const [y, m] = e.date.split('-').map(Number);
        return `${y}|${m - 1}|${e.description.trim().toLowerCase()}|${e.type}`;
      })
    );

    const toInsert: Array<{
      cashflow_id: string;
      description: string;
      type: 'income' | 'expense';
      amount: number;
      category: string | null;
      goal_id: string | null;
      date: string;
      is_recurring: boolean;
      recurrence_interval: 'monthly' | 'yearly' | null;
      yearly_calculation: 'prorated' | 'exact' | null;
    }> = [];
    for (const entry of uniqueRecurring) {
      const [entryYear, entryMonthNumber, entryDay] = entry.date.split('-').map(Number);
      
      const tempDate = new Date(entryYear, entryMonthNumber - 1, 1);
      while (tempDate <= currentMonthStart) {
        const y = tempDate.getFullYear();
        const m = tempDate.getMonth();

        // Check if yearly and not anniversary
        if (entry.recurrence_interval === 'yearly' && (entryMonthNumber - 1) !== m) {
          tempDate.setMonth(tempDate.getMonth() + 1);
          continue;
        }

        const lastDayOfTempMonth = new Date(y, m + 1, 0).getDate();
        const targetDay = Math.min(entryDay, lastDayOfTempMonth);

        // If it's the current month, verify it is not in the future relative to today's local date
        if (y === currentYear && m === currentMonth) {
          const todayDay = now.getDate();
          if (targetDay > todayDay) {
            tempDate.setMonth(tempDate.getMonth() + 1);
            continue;
          }
        }

        const key = `${y}|${m}|${entry.description.trim().toLowerCase()}|${entry.type}`;
        if (!pastExistingSet.has(key)) {
          const formattedDate = formatLocalYYYYMMDD(y, m, targetDay);

          toInsert.push({
            cashflow_id: cashflowId,
            description: entry.description.trim(),
            type: entry.type === 'income' ? 'income' : 'expense',
            amount: entry.amount,
            category: getRecurringCategory(entry),
            goal_id: entry.goal_id ?? null,
            date: formattedDate,
            is_recurring: true,
            recurrence_interval: entry.recurrence_interval === 'monthly' ? 'monthly' : entry.recurrence_interval === 'yearly' ? 'yearly' : null,
            yearly_calculation: entry.yearly_calculation === 'prorated' ? 'prorated' : entry.yearly_calculation === 'exact' ? 'exact' : null,
          });
        }
        tempDate.setMonth(tempDate.getMonth() + 1);
      }
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('cashflow_entries')
        .insert(toInsert);

      if (insertError) {
        console.error('Failed to insert past recurring entries:', insertError);
        return { error: 'Failed to generate past entries' };
      }
    }

    revalidatePath('/cashflow');
    revalidatePath(`/cashflow/${cashflowId}`);
    return { generated: toInsert.length };
  }

  // Get all entries for the current month to check for existing entries
  const monthStart = formatLocalYYYYMMDD(currentYear, currentMonth, 1);
  const monthEnd = formatLocalYYYYMMDD(currentYear, currentMonth, new Date(currentYear, currentMonth + 1, 0).getDate());

  const { data: existingThisMonth, error: existingError } = await supabase
    .from('cashflow_entries')
    .select('description, type, amount')
    .eq('cashflow_id', cashflowId)
    .gte('date', monthStart)
    .lte('date', monthEnd);

  if (existingError) {
    console.error('Failed to fetch existing entries:', existingError);
    return { error: 'Failed to check existing entries' };
  }

  const existingSet = new Set(
    (existingThisMonth || []).map((e) => `${e.description.trim().toLowerCase()}|${e.type}`)
  );

  // Generate missing entries
  const toInsert = uniqueRecurring
    .filter((entry) => !existingSet.has(`${entry.description.trim().toLowerCase()}|${entry.type}`))
    .map((entry) => {
      const [, , entryDay] = entry.date.split('-').map(Number);
      // Handle month-end cases (e.g. 31st of Jan -> 28th of Feb)
      const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const targetDay = Math.min(entryDay, lastDayOfCurrentMonth);
      const formattedDate = formatLocalYYYYMMDD(currentYear, currentMonth, targetDay);

      return {
        cashflow_id: cashflowId,
        description: entry.description.trim(),
        type: entry.type,
        amount: entry.amount,
        category: getRecurringCategory(entry),
        goal_id: entry.goal_id ?? null,
        date: formattedDate,
        is_recurring: true,
        recurrence_interval: entry.recurrence_interval,
        yearly_calculation: entry.yearly_calculation,
        targetDay,
      };
    })
    .filter((entry) => {
      const todayDay = now.getDate();
      const todayMonth = now.getMonth();
      const todayYear = now.getFullYear();

      // Check if target date is in the future relative to current local date
      const isFuture =
        currentYear > todayYear ||
        (currentYear === todayYear && currentMonth > todayMonth) ||
        (currentYear === todayYear && currentMonth === todayMonth && entry.targetDay > todayDay);

      // Since this block is only reached for "Generate Early", we only generate future entries
      if (!isFuture) {
        return false;
      }
      return true;
    })
    .map((entry) => ({
      cashflow_id: entry.cashflow_id,
      description: entry.description,
      type: entry.type === 'income' ? 'income' : 'expense',
      amount: entry.amount,
      category: entry.category,
      goal_id: entry.goal_id,
      date: entry.date,
      is_recurring: entry.is_recurring,
      recurrence_interval: entry.recurrence_interval === 'monthly' ? 'monthly' : entry.recurrence_interval === 'yearly' ? 'yearly' : null,
      yearly_calculation: entry.yearly_calculation === 'prorated' ? 'prorated' : entry.yearly_calculation === 'exact' ? 'exact' : null,
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('cashflow_entries')
      .insert(toInsert);

    if (insertError) {
      console.error('Failed to insert recurring entries:', insertError);
      return { error: 'Failed to generate entries' };
    }

    const expenseCategories: string[] = [];
    for (const e of toInsert) {
      if (e.type === 'expense' && e.category) {
        expenseCategories.push(e.category);
      }
    }

    for (const cat of new Set(expenseCategories)) {
      await checkBudgetThresholds(supabase, cashflowId, cat, user.id);
    }
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  return { generated: toInsert.length };
}

export async function addGoal(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const formDataObj = Object.fromEntries(formData);
  const parsed = cashflowGoalSchema.safeParse(formDataObj);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { cashflowId, title, targetAmount, deadline } = parsed.data;

  if (!(await isCashflowOwner(supabase, cashflowId, user.id))) {
    return { error: 'Only the cashflow owner can manage savings goals' };
  }

  const { data: goal, error } = await supabase
    .from('cashflow_goals')
    .insert({
      cashflow_id: cashflowId,
      title: title.trim(),
      target_amount: targetAmount,
      deadline: deadline || null,
      is_deleted: false,
    })
    .select()
    .single();

  if (error || !goal) {
    console.error('Failed to create goal:', error);
    return { error: 'Failed to create goal' };
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  return { goal: mapGoalToDTO(goal) };
}

export async function updateGoal(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const formDataObj = Object.fromEntries(formData);
  const parsed = updateCashflowGoalSchema.safeParse(formDataObj);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { goalId, cashflowId, title, targetAmount, deadline } = parsed.data;

  if (!(await isCashflowOwner(supabase, cashflowId, user.id))) {
    return { error: 'Only the cashflow owner can manage savings goals' };
  }

  const { data: goal, error } = await supabase
    .from('cashflow_goals')
    .update({
      title: title.trim(),
      target_amount: targetAmount,
      deadline: deadline || null,
    })
    .eq('id', goalId)
    .eq('cashflow_id', cashflowId)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error || !goal) {
    console.error('Failed to update goal:', error);
    return { error: 'Failed to update goal' };
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  revalidatePath(`/cashflow/goal/${goalId}`);
  return { goal: mapGoalToDTO(goal) };
}

export async function deleteGoal(goalId: string, cashflowId: string) {
  const { user, supabase } = await getAuthenticatedUser();

  const parsed = deleteCashflowGoalSchema.safeParse({ goalId });
  const parsedCashflowId = z.uuid().safeParse(cashflowId);

  if (!parsed.success || !parsedCashflowId.success) {
    return { error: 'Invalid goal ID or cashflow ID' };
  }

  if (!(await isCashflowOwner(supabase, cashflowId, user.id))) {
    return { error: 'Only the cashflow owner can manage savings goals' };
  }

  const { data: goal, error: goalLookupError } = await supabase
    .from('cashflow_goals')
    .select('id')
    .eq('id', goalId)
    .eq('cashflow_id', cashflowId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (goalLookupError) {
    console.error('Failed to find goal to archive:', goalLookupError);
    return { error: 'Failed to archive goal' };
  }

  if (!goal) {
    return { error: 'Savings goal not found or already archived' };
  }

  const { error } = await supabase
    .from('cashflow_goals')
    .update({ is_deleted: true })
    .eq('id', goalId)
    .eq('cashflow_id', cashflowId)
    .eq('is_deleted', false);

  if (error) {
    console.error('Failed to archive goal:', error);
    return { error: 'Savings goal not found or already archived' };
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  revalidatePath(`/cashflow/goal/${goalId}`);
  return { success: true };
}

export async function duplicateCashflow(cashflowId: string) {
  const { user, supabase } = await getAuthenticatedUser();

  const parsedId = z.string().uuid().safeParse(cashflowId);
  if (!parsedId.success) {
    return { error: 'Invalid cashflow ID' };
  }

  // 1. Fetch original cashflow
  const { data: original, error: origError } = await supabase
    .from('cashflows')
    .select('*')
    .eq('id', cashflowId)
    .single();

  if (origError || !original) {
    return { error: 'Cashflow not found' };
  }

  // Verify permission: User must be owner or have share access
  const perm = await checkEditPermission(supabase, cashflowId, user, original.user_id);
  if (!perm.canEdit) {
    return { error: 'You do not have permission to duplicate this cashflow' };
  }

  // 2. Create duplicate cashflow book owned by current user
  const { data: newCashflow, error: createError } = await supabase
    .from('cashflows')
    .insert({
      user_id: user.id,
      title: `${original.title} (Copy)`,
      is_public: false,
    })
    .select()
    .single();

  if (createError || !newCashflow) {
    console.error('Failed to create duplicate cashflow:', createError);
    return { error: 'Failed to duplicate cashflow' };
  }

  const now = new Date();

  // 3. Duplicate goals (and map old goal IDs to new goal IDs)
  const goalIdMap = new Map<string, string>();
  const { data: originalGoals } = await supabase
    .from('cashflow_goals')
    .select('*')
    .eq('cashflow_id', cashflowId)
    .eq('is_deleted', false);

  if (originalGoals && originalGoals.length > 0) {
    for (const goal of originalGoals) {
      const { data: newGoal } = await supabase
        .from('cashflow_goals')
        .insert({
          cashflow_id: newCashflow.id,
          title: goal.title,
          target_amount: goal.target_amount,
          deadline: goal.deadline,
          is_deleted: false,
        })
        .select()
        .single();

      if (newGoal) {
        goalIdMap.set(goal.id, newGoal.id);
      }
    }
  }

  // 4. Duplicate budgets
  const { data: originalBudgets } = await supabase
    .from('cashflow_budgets')
    .select('*')
    .eq('cashflow_id', cashflowId);

  if (originalBudgets && originalBudgets.length > 0) {
    const toInsertBudgets = originalBudgets.map((b) => ({
      cashflow_id: newCashflow.id,
      category: b.category,
      amount: b.amount,
    }));
    await supabase.from('cashflow_budgets').insert(toInsertBudgets);
  }

  // 5. Duplicate entries (shift dates to current month and map goal IDs)
  const { data: originalEntries } = await supabase
    .from('cashflow_entries')
    .select('*')
    .eq('cashflow_id', cashflowId);

  if (originalEntries && originalEntries.length > 0) {
    const toInsertEntries = originalEntries.map((e) => ({
      cashflow_id: newCashflow.id,
      description: e.description,
      amount: e.amount,
      type: e.type,
      category: e.category,
      date: shiftToCurrentMonth(e.date, now),
      is_recurring: e.is_recurring,
      recurrence_interval: e.recurrence_interval,
      yearly_calculation: e.yearly_calculation,
      goal_id: e.goal_id ? goalIdMap.get(e.goal_id) || null : null,
    }));

    await supabase.from('cashflow_entries').insert(toInsertEntries);
  }

  revalidatePath('/cashflow');
  revalidatePath('/app');
  return { success: true, id: newCashflow.id };
}

