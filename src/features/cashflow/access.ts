import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface AccessibleCashflow {
  id: string
  title: string
}

interface PostgrestLikeError {
  code?: string
  message?: string
  status?: number
}

function isPostgrestLikeError(error: unknown): error is PostgrestLikeError {
  return typeof error === 'object' && error !== null
}

function isAuthExpiredError(error: unknown): boolean {
  if (!isPostgrestLikeError(error)) return false
  if (typeof error.code === 'string' && error.code === 'PGRST301') return true
  if (typeof error.status === 'number' && error.status === 401) return true
  if (typeof error.message === 'string') {
    const lower = error.message.toLowerCase()
    return lower.includes('jwt') || lower.includes('expired') || lower.includes('claim')
  }
  return false
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
  const [initialOwnedResult, initialSharesResult] = await Promise.all([
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

  let ownedCashflows: { id: string; title: string; created_at: string | null }[] = []
  if (initialOwnedResult.error) {
    if (isAuthExpiredError(initialOwnedResult.error)) {
      console.warn('cashflow_access_owned_auth_expired', initialOwnedResult.error)
      return []
    }
    console.warn('cashflow_access_owned_lookup_retrying', initialOwnedResult.error)
    const retryOwned = await supabase
      .from('cashflows')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (retryOwned.error) {
      if (isAuthExpiredError(retryOwned.error)) {
        console.warn('cashflow_access_owned_auth_expired_retry', retryOwned.error)
        return []
      }
      console.error('cashflow_access_owned_lookup_failed_after_retry', retryOwned.error)
      ownedCashflows = []
    } else {
      ownedCashflows = retryOwned.data ?? []
    }
  } else {
    ownedCashflows = initialOwnedResult.data ?? []
  }

  let sharesData: { cashflow_id: string }[] = []
  if (initialSharesResult?.error) {
    if (isAuthExpiredError(initialSharesResult.error)) {
      console.warn('cashflow_access_shares_auth_expired', initialSharesResult.error)
      sharesData = []
    } else {
      console.warn('cashflow_access_shares_lookup_retrying', initialSharesResult.error)
      const retryShares = await supabase
        .from('cashflow_shares')
        .select('cashflow_id')
        .eq('email', (userEmail ?? '').trim().toLowerCase())

      if (retryShares.error) {
        console.error('cashflow_access_shares_lookup_failed_after_retry', retryShares.error)
        sharesData = []
      } else {
        sharesData = retryShares.data ?? []
      }
    }
  } else {
    sharesData = initialSharesResult?.data ?? []
  }

  const ownedMap = new Map(ownedCashflows.map((c) => [c.id, c]))

  const sharedCashflowIds = new Set<string>()
  for (const share of sharesData) {
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

  let sharedCashflows: { id: string; title: string; created_at: string | null }[] = []
  const initialSharedResult = await supabase
    .from('cashflows')
    .select('id, title, created_at')
    .in('id', Array.from(sharedCashflowIds))
    .order('created_at', { ascending: false })

  if (initialSharedResult.error) {
    if (isAuthExpiredError(initialSharedResult.error)) {
      console.warn('cashflow_access_filtered_auth_expired', initialSharedResult.error)
      return ownedCashflows.map(({ id, title }) => ({ id, title }))
    }
    console.warn('cashflow_access_filtered_lookup_retrying', initialSharedResult.error)
    const retryShared = await supabase
      .from('cashflows')
      .select('id, title, created_at')
      .in('id', Array.from(sharedCashflowIds))
      .order('created_at', { ascending: false })

    if (retryShared.error) {
      console.error('cashflow_access_filtered_lookup_failed_after_retry', retryShared.error)
      sharedCashflows = []
    } else {
      sharedCashflows = retryShared.data ?? []
    }
  } else {
    sharedCashflows = initialSharedResult.data ?? []
  }

  const allCashflows = [...ownedCashflows, ...sharedCashflows]
  allCashflows.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())

  return allCashflows.map(({ id, title }) => ({ id, title }))
}
