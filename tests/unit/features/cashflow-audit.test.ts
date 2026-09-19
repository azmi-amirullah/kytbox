import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetAuthenticatedUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}))

import { mapCashflowAuditLogToDTO } from '@/lib/mappers'
import {
  recordCashflowAuditLog,
  getCashflowAuditLogs,
  type MinimalAuditSupabaseClient,
} from '@/features/cashflow/audit'

describe('Cashflow Audit Trail & Activity Feed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps audit log row to DTO correctly without type assertions', () => {
    const rawRow = {
      id: 'audit-1',
      cashflow_id: 'cf-1',
      actor_id: 'user-1',
      actor_email: 'alice@example.com',
      actor_name: 'Alice Smith',
      action: 'create_entry',
      entity_type: 'entry',
      entity_id: 'entry-123',
      description: 'Added "Starbucks" (-$4.50, Food)',
      diff_summary: {
        amount: 4.5,
        category: 'Food',
      },
      created_at: '2026-09-20T10:00:00Z',
    }

    const dto = mapCashflowAuditLogToDTO(rawRow)

    expect(dto.id).toBe('audit-1')
    expect(dto.cashflow_id).toBe('cf-1')
    expect(dto.actor_id).toBe('user-1')
    expect(dto.actor_email).toBe('alice@example.com')
    expect(dto.actor_name).toBe('Alice Smith')
    expect(dto.action).toBe('create_entry')
    expect(dto.entity_type).toBe('entry')
    expect(dto.entity_id).toBe('entry-123')
    expect(dto.description).toBe('Added "Starbucks" (-$4.50, Food)')
    expect(dto.diff_summary).toEqual({
      amount: 4.5,
      category: 'Food',
    })
    expect(dto.created_at).toBe('2026-09-20T10:00:00Z')
  })

  it('handles null and undefined optional fields safely in mapper', () => {
    const rawRow = {
      id: 'audit-2',
      cashflow_id: 'cf-2',
      action: 'delete_entry',
      entity_type: 'entry',
      description: 'Deleted "Lunch" (-$15.00)',
      created_at: '2026-09-20T11:00:00Z',
    }

    const dto = mapCashflowAuditLogToDTO(rawRow)

    expect(dto.id).toBe('audit-2')
    expect(dto.actor_id).toBeNull()
    expect(dto.actor_email).toBeNull()
    expect(dto.actor_name).toBeNull()
    expect(dto.entity_id).toBeNull()
    expect(dto.diff_summary).toBeNull()
  })

  it('recordCashflowAuditLog catches errors and does not throw', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: { message: 'Database connection failed' },
    })

    const mockSupabase: MinimalAuditSupabaseClient = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    }

    await expect(
      recordCashflowAuditLog({
        supabase: mockSupabase,
        cashflowId: 'cf-1',
        actorId: 'user-1',
        actorEmail: 'test@example.com',
        actorName: 'Tester',
        action: 'create_entry',
        entityType: 'entry',
        description: 'Added test entry',
      }),
    ).resolves.toBeUndefined()

    expect(mockSupabase.from).toHaveBeenCalledWith('cashflow_audit_logs')
    expect(mockInsert).toHaveBeenCalledWith({
      cashflow_id: 'cf-1',
      actor_id: 'user-1',
      actor_email: 'test@example.com',
      actor_name: 'Tester',
      action: 'create_entry',
      entity_type: 'entry',
      entity_id: null,
      description: 'Added test entry',
      diff_summary: null,
    })
  })

  it('getCashflowAuditLogs verifies owner access and returns logs', async () => {
    const mockLogs = [
      {
        id: 'log-1',
        cashflow_id: 'cf-1',
        actor_id: 'user-1',
        actor_email: 'alice@example.com',
        actor_name: 'Alice',
        action: 'create_entry',
        entity_type: 'entry',
        entity_id: 'e-1',
        description: 'Added Coffee',
        diff_summary: null,
        created_at: '2026-09-20T12:00:00Z',
      },
    ]

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'cf-1', user_id: 'user-1', is_public: false },
          error: null,
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: mockLogs,
            error: null,
          }),
        }),
      }),
    })

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    }

    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: 'user-1', email: 'alice@example.com' },
      supabase: mockSupabase,
    })

    const result = await getCashflowAuditLogs('cf-1', 20)

    expect(result.error).toBeUndefined()
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0].description).toBe('Added Coffee')
  })

  it('getCashflowAuditLogs blocks unauthorized non-collaborators', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'cf-1', user_id: 'owner-id', is_public: false },
          error: null,
        }),
      }),
    })

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'cashflows') {
          return { select: mockSelect }
        }
        if (table === 'cashflow_shares') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null, // no share
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      }),
    }

    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: 'stranger-id', email: 'stranger@example.com' },
      supabase: mockSupabase,
    })

    const result = await getCashflowAuditLogs('cf-1')

    expect(result.error).toBe(
      'You do not have permission to view activity logs for this book',
    )
    expect(result.data).toBeUndefined()
  })
})
