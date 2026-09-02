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
  const [ownedResult, sharesResult] = await Promise.all([
    supabase
      .from('cashflows')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    userEmail
      ? supabase
          .from('cashflow_shares')
          .select('cashflow_id')
          .eq('email', userEmail.trim().toLowerCase())
      : Promise.resolve({ data: null, error: null }),
  ])

  if (ownedResult.error) {
    console.error('cashflow_access_owned_lookup_failed', ownedResult.error)
    throw new Error('CASHFLOW_ACCESS_LOOKUP_FAILED')
  }

  if (sharesResult?.error) {
    console.error('cashflow_access_share_lookup_failed', sharesResult.error)
    throw new Error('CASHFLOW_ACCESS_LOOKUP_FAILED')
  }

  const ownedCashflows = ownedResult.data ?? []
  const ownedMap = new Map(ownedCashflows.map((c) => [c.id, c]))

  const sharedCashflowIds = new Set<string>()
  for (const share of sharesResult?.data ?? []) {
    if (!ownedMap.has(share.cashflow_id)) {
      sharedCashflowIds.add(share.cashflow_id)
    }
  }

  if (includeCashflowId && !ownedMap.has(includeCashflowId)) {
    sharedCashflowIds.add(includeCashflowId)
  }

  // Fast path: if no external shared books, return owned books directly (saves a database query)
  if (sharedCashflowIds.size === 0) {
    return ownedCashflows.map(({ id, title }) => ({ id, title }))
  }

  const sharedResult = await supabase
    .from('cashflows')
    .select('id, title, created_at')
    .in('id', Array.from(sharedCashflowIds))
    .order('created_at', { ascending: false })

  if (sharedResult.error) {
    console.error('cashflow_access_filtered_lookup_failed', sharedResult.error)
    throw new Error('CASHFLOW_ACCESS_LOOKUP_FAILED')
  }

  const allCashflows = [...ownedCashflows, ...(sharedResult.data ?? [])]
  allCashflows.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())

  return allCashflows.map(({ id, title }) => ({ id, title }))
}
