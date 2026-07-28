import 'server-only'

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { mapGoalToDTO, mapCashflowEntryToDTO } from '@/lib/mappers'
import { getAccessibleCashflows } from './access'
import type { CashflowGoalDTO, CashflowEntryDTO } from '@/types/dto'

export interface GoalDetailResult {
  goal: CashflowGoalDTO
  entries: CashflowEntryDTO[]
  currency: string | null
}

export async function getGoalDetailData(
  supabase: SupabaseClient<Database>,
  goalId: string,
  userId: string,
  userEmail?: string,
): Promise<GoalDetailResult> {
  const [goalResult, profileResult] = await Promise.all([
    supabase
      .from('cashflow_goals')
      .select('*')
      .eq('id', goalId)
      .eq('is_deleted', false)
      .maybeSingle(),
    supabase.from('profiles').select('default_currency').eq('id', userId).single(),
  ])

  if (goalResult.error || profileResult.error) {
    console.error('cashflow_goal_detail_base_lookup_failed', {
      goal: goalResult.error,
      profile: profileResult.error,
    })
    throw new Error('GOAL_DETAIL_LOOKUP_FAILED')
  }

  const goal = goalResult.data
  if (!goal) throw new Error('GOAL_NOT_FOUND')

  const accessibleCashflows = await getAccessibleCashflows(
    supabase,
    userId,
    userEmail,
    goal.cashflow_id,
  )
  const cashflowTitle =
    accessibleCashflows.find((cashflow) => cashflow.id === goal.cashflow_id)
      ?.title ?? null

  const [progressResult, entriesResult] = await Promise.all([
    supabase
      .from('cashflow_goal_progress')
      .select('cashflow_id, goal_id, saved_amount, contribution_count')
      .eq('goal_id', goal.id)
      .maybeSingle(),
    supabase
      .from('cashflow_entries')
      .select('*')
      .eq('goal_id', goal.id)
      .eq('type', 'expense')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  if (progressResult.error || entriesResult.error) {
    console.error('cashflow_goal_detail_lookup_failed', {
      progress: progressResult.error,
      entries: entriesResult.error,
    })
    throw new Error('GOAL_DETAIL_LOOKUP_FAILED')
  }

  const progress = progressResult.data
  const entries = (entriesResult.data ?? []).map((entry) =>
    mapCashflowEntryToDTO(entry, goal.title),
  )

  return {
    goal: mapGoalToDTO(
      goal,
      cashflowTitle,
      progress?.saved_amount ?? 0,
      progress?.contribution_count ?? 0,
    ),
    entries,
    currency: profileResult.data?.default_currency ?? null,
  }
}
