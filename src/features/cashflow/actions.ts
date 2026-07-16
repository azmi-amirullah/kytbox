'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserWithRateLimit as getAuthenticatedUser } from '@/lib/auth-with-rate-limit';
import { z } from 'zod';
import {
  cashflowEntrySchema,
  updateCashflowEntrySchema,
  cashflowBudgetSchema,
  deleteCashflowBudgetSchema,
  generateRecurringSchema,
} from './schemas.server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { mapBudgetToDTO } from '@/lib/mappers';

// Extracts user_id from Supabase joined relation (e.g. cashflows(user_id))
const joinedOwnerSchema = z
  .object({ user_id: z.string() })
  .nullish()
  .transform((v) => v?.user_id);

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
    .eq('email', user.email?.toLowerCase() || '')
    .eq('role', 'edit')
    .single();

  if (share) {
    return { canEdit: true };
  }

  return {
    canEdit: false,
    error: 'You do not have permission to edit this cashflow',
  };
}

export async function addEntry(formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const formDataObj = Object.fromEntries(formData);
  const parsed = updateCashflowEntrySchema.safeParse(formDataObj);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    cashflowId,
    description,
    type,
    category,
    date,
    amount,
    is_recurring,
    recurrence_interval,
    yearly_calculation,
  } = parsed.data;

  // Verify access (owner or editor)
  const permission = await checkEditPermission(supabase, cashflowId, user);
  if (!permission.canEdit) {
    return { error: permission.error || 'Access denied' };
  }

  // Prevent accidental recurring series cancellation
  if (!is_recurring) {
    const { data: activeTemplates } = await supabase
      .rpc('get_latest_recurring_templates', { p_cashflow_id: cashflowId });

    if (activeTemplates) {
      const isKillingSeries = activeTemplates.some((t) => 
        t.is_recurring && 
        t.type === type && 
        t.description.trim().toLowerCase() === description.trim().toLowerCase()
      );

      if (isKillingSeries) {
        return { error: `A recurring series with name "${description.trim()}" is active. Please use a slightly different name for this manual entry to avoid conflicts.` };
      }
    }
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
    is_recurring: is_recurring,
    recurrence_interval: is_recurring ? recurrence_interval : null,
    yearly_calculation:
      is_recurring && recurrence_interval === 'yearly'
        ? yearly_calculation
        : null,
  });

  if (error) {
    console.error('Failed to add entry:', error);
    return { error: error.message };
  }

  revalidatePath('/cashflow');
  return { success: true };
}

export async function updateEntry(entryId: string, formData: FormData) {
  const { user, supabase } = await getAuthenticatedUser();

  const formDataObj = Object.fromEntries(formData);
  const parsed = cashflowEntrySchema.safeParse(formDataObj);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    description,
    type,
    category,
    date,
    amount,
    is_recurring,
    recurrence_interval,
    yearly_calculation,
  } = parsed.data;

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

  // Prevent accidental recurring series cancellation
  if (!is_recurring) {
    const { data: activeTemplates } = await supabase
      .rpc('get_latest_recurring_templates', { p_cashflow_id: entry.cashflow_id });

    if (activeTemplates) {
      const isKillingSeries = activeTemplates.some((t) => 
        t.is_recurring && 
        t.type === type && 
        t.description.trim().toLowerCase() === description.trim().toLowerCase() &&
        t.id !== entryId
      );

      if (isKillingSeries) {
        return { error: `A recurring series with name "${description.trim()}" is active. Please use a slightly different name for this manual entry to avoid conflicts.` };
      }
    }
  }

  const { error } = await supabase
    .from('cashflow_entries')
    .update({
      description: description.trim(),
      amount,
      type,
      category: category ?? null,
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

export async function generateRecurringEntries(
  cashflowId: string,
  targetYear?: number,
  targetMonth?: number
) {
  const parsed = generateRecurringSchema.safeParse({
    cashflowId,
    targetYear,
    targetMonth,
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

  const formatLocalYYYYMMDD = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

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
        category: entry.category,
        date: formattedDate,
        is_recurring: true,
        recurrence_interval: entry.recurrence_interval,
        yearly_calculation: entry.yearly_calculation,
      };
    });

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('cashflow_entries')
      .insert(toInsert);

    if (insertError) {
      console.error('Failed to insert recurring entries:', insertError);
      return { error: 'Failed to generate entries' };
    }
  }

  revalidatePath('/cashflow');
  revalidatePath(`/cashflow/${cashflowId}`);
  return { generated: toInsert.length };
}

