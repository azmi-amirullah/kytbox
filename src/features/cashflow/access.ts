import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface AccessibleCashflow {
  id: string
  title: string
}

/**
 * Resolve only books the current user owns or has an explicit share for.
 * The final cashflows query remains RLS-filtered so stale or revoked shares
 * cannot widen the result set.
 */
export async function getAccessibleCashflows(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail: string | undefined,
  includeCashflowId?: string,
): Promise<AccessibleCashflow[]> {
  const ownedResult = await supabase
    .from('cashflows')
    .select('id, title')
    .eq('user_id', userId)

  if (ownedResult.error) {
    console.error('cashflow_access_owned_lookup_failed', ownedResult.error)
    throw new Error('CASHFLOW_ACCESS_LOOKUP_FAILED')
  }

  const sharedCashflowIds = new Set<string>()
  if (userEmail) {
    const sharesResult = await supabase
      .from('cashflow_shares')
      .select('cashflow_id')
      .eq('email', userEmail.trim().toLowerCase())

    if (sharesResult.error) {
      console.error('cashflow_access_share_lookup_failed', sharesResult.error)
      throw new Error('CASHFLOW_ACCESS_LOOKUP_FAILED')
    }

    for (const share of sharesResult.data ?? []) {
      sharedCashflowIds.add(share.cashflow_id)
    }
  }

  const requestedIds = new Set<string>([
    ...(ownedResult.data ?? []).map((cashflow) => cashflow.id),
    ...sharedCashflowIds,
  ])
  if (includeCashflowId) requestedIds.add(includeCashflowId)

  if (requestedIds.size === 0) return []

  const accessibleResult = await supabase
    .from('cashflows')
    .select('id, title')
    .in('id', Array.from(requestedIds))
    .order('created_at', { ascending: false })

  if (accessibleResult.error) {
    console.error('cashflow_access_filtered_lookup_failed', accessibleResult.error)
    throw new Error('CASHFLOW_ACCESS_LOOKUP_FAILED')
  }

  return accessibleResult.data ?? []
}
