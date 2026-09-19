'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
import type { CashflowAuditLogDTO } from '@/types/dto'
import { getAuthenticatedUser } from '@/lib/auth'
import { mapCashflowAuditLogToDTO } from '@/lib/mappers'

export type AuditAction =
  | 'create_entry'
  | 'update_entry'
  | 'delete_entry'
  | 'bulk_delete'
  | 'create_budget'
  | 'update_budget'
  | 'delete_budget'
  | 'share_invite'

export type AuditEntityType = 'entry' | 'budget' | 'share' | 'goal' | 'cashflow'

export interface MinimalAuditSupabaseClient {
  from: (table: 'cashflow_audit_logs') => {
    insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null } | { error: null }>
  }
}

export interface RecordAuditLogParams {
  supabase: SupabaseClient<Database> | MinimalAuditSupabaseClient
  cashflowId: string
  actorId?: string | null
  actorEmail?: string | null
  actorName?: string | null
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string | null
  description: string
  diffSummary?: Json | null
}

/**
 * Non-blocking audit logger that persists user mutations to cashflow_audit_logs.
 */
export async function recordCashflowAuditLog({
  supabase,
  cashflowId,
  actorId = null,
  actorEmail = null,
  actorName = null,
  action,
  entityType,
  entityId = null,
  description,
  diffSummary = null,
}: RecordAuditLogParams): Promise<void> {
  try {
    const { error } = await supabase.from('cashflow_audit_logs').insert({
      cashflow_id: cashflowId,
      actor_id: actorId,
      actor_email: actorEmail,
      actor_name: actorName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      diff_summary: diffSummary,
    })

    if (error) {
      console.warn('[AuditLog] Failed to record cashflow audit log:', error.message)
    }
  } catch (err) {
    console.warn('[AuditLog] Unexpected error recording audit log:', err)
  }
}

/**
 * Server Action to fetch recent audit logs for a cashflow book.
 * Strictly checks that the caller is the book owner or an authorized collaborator.
 */
export async function getCashflowAuditLogs(
  cashflowId: string,
  limit = 50,
): Promise<{ data?: CashflowAuditLogDTO[]; error?: string }> {
  try {
    const { user, supabase } = await getAuthenticatedUser()

    // 1. Verify view access (owner or explicit collaborator)
    const { data: cashflow, error: cfError } = await supabase
      .from('cashflows')
      .select('id, user_id, is_public')
      .eq('id', cashflowId)
      .maybeSingle()

    if (cfError || !cashflow) {
      return { error: 'Cashflow book not found' }
    }

    const isOwner = cashflow.user_id === user.id
    let isCollaborator = false

    if (!isOwner && user.email) {
      const { data: share } = await supabase
        .from('cashflow_shares')
        .select('id')
        .eq('cashflow_id', cashflowId)
        .eq('email', user.email.toLowerCase().trim())
        .maybeSingle()

      isCollaborator = Boolean(share)
    }

    if (!isOwner && !isCollaborator) {
      return { error: 'You do not have permission to view activity logs for this book' }
    }

    // 2. Fetch audit logs (up to limit)
    const safeLimit = Math.min(Math.max(1, limit), 100)
    const { data: logs, error: logsError } = await supabase
      .from('cashflow_audit_logs')
      .select('*')
      .eq('cashflow_id', cashflowId)
      .order('created_at', { ascending: false })
      .limit(safeLimit)

    if (logsError) {
      console.error('[AuditLog] Failed to fetch audit logs:', logsError)
      return { error: 'Failed to fetch activity logs' }
    }

    const mapped = (logs ?? []).map((row) => mapCashflowAuditLogToDTO(row))
    return { data: mapped }
  } catch (err) {
    console.error('[AuditLog] Unexpected error fetching audit logs:', err)
    return { error: 'An unexpected error occurred while loading activity' }
  }
}
