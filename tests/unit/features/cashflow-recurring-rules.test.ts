import { describe, it, expect } from 'vitest'
import {
  cashflowRecurringRuleSchema,
  updateCashflowRecurringRuleSchema,
  toggleCashflowRecurringRuleSchema,
  deleteCashflowRecurringRuleSchema,
  cashflowEntrySchema,
} from '@/features/cashflow/schemas.server'
import {
  mapCashflowRecurringRuleToDTO,
  mapCashflowEntryToDTO,
} from '@/lib/mappers'
import { calculateProjections } from '@/features/cashflow/math'
import type { CashflowRecurringRuleDTO, CashflowEntryDTO } from '@/types/dto'

describe('Cashflow Recurring Rules Architecture', () => {
  describe('Validation Schemas', () => {
    it('validates a correct recurring rule creation schema', () => {
      const validPayload = {
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        description: 'Netflix Subscription',
        amount: '15.99',
        type: 'expense',
        category: 'Entertainment',
        recurrence_interval: 'monthly',
        day_of_month: '15',
        is_active: 'true',
        start_date: '2026-01-15',
      }

      const result = cashflowRecurringRuleSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.amount).toBe(15.99)
        expect(result.data.day_of_month).toBe(15)
        expect(result.data.is_active).toBe(true)
        expect(result.data.recurrence_interval).toBe('monthly')
      }
    })

    it('validates a correct recurring rule update schema', () => {
      const updatePayload = {
        ruleId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        cashflowId: 'b2c3d4e5-f6a7-4b8c-9d0e-123456789abc',
        description: 'Netflix 4K Upgrade',
        amount: 22.99,
        type: 'expense',
        category: 'Entertainment',
        recurrence_interval: 'monthly',
        day_of_month: 15,
        is_active: true,
      }

      const result = updateCashflowRecurringRuleSchema.safeParse(updatePayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ruleId).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab')
        expect(result.data.amount).toBe(22.99)
      }
    })

    it('rejects invalid day of month outside 1-31', () => {
      const invalidPayload = {
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        description: 'Rent',
        amount: 1000,
        type: 'expense',
        day_of_month: 32,
      }

      const result = cashflowRecurringRuleSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
    })

    it('rejects non-positive amount in recurring rule', () => {
      const invalidPayload = {
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        description: 'Free Tier',
        amount: 0,
        type: 'expense',
      }

      const result = cashflowRecurringRuleSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
    })

    it('validates toggle schema', () => {
      const valid = toggleCashflowRecurringRuleSchema.safeParse({
        ruleId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        is_active: false,
      })
      expect(valid.success).toBe(true)

      const invalid = toggleCashflowRecurringRuleSchema.safeParse({
        ruleId: 'not-a-uuid',
        is_active: false,
      })
      expect(invalid.success).toBe(false)
    })

    it('validates delete rule schema', () => {
      const valid = deleteCashflowRecurringRuleSchema.safeParse({
        ruleId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
      })
      expect(valid.success).toBe(true)
    })

    it('validates cashflow entry with recurring_rule_id and update_recurring_rule flag', () => {
      const payload = {
        description: 'Netflix 4K Tier',
        amount: 22.99,
        type: 'expense',
        date: '2026-03-15',
        is_recurring: true,
        recurring_rule_id: 'b2c3d4e5-f6a7-4b8c-9d0e-123456789abc',
        update_recurring_rule: 'true',
      }

      const result = cashflowEntrySchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.recurring_rule_id).toBe('b2c3d4e5-f6a7-4b8c-9d0e-123456789abc')
        expect(result.data.update_recurring_rule).toBe(true)
      }
    })
  })

  describe('DTO Mappers', () => {
    it('maps database recurring rule record to DTO accurately', () => {
      const dbRecord = {
        id: 'rule-123',
        cashflow_id: 'cf-456',
        goal_id: 'goal-789',
        description: 'Spotify Family',
        amount: 19.99,
        type: 'expense' as const,
        category: 'Entertainment',
        recurrence_interval: 'monthly',
        yearly_calculation: null,
        day_of_month: 20,
        is_active: true,
        start_date: '2026-01-20',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }

      const dto = mapCashflowRecurringRuleToDTO(dbRecord)
      expect(dto.id).toBe('rule-123')
      expect(dto.cashflow_id).toBe('cf-456')
      expect(dto.goal_id).toBe('goal-789')
      expect(dto.amount).toBe(19.99)
      expect(dto.is_active).toBe(true)
      expect(dto.day_of_month).toBe(20)
    })

    it('maps cashflow entry with recurring_rule_id', () => {
      const dbEntry = {
        id: 'entry-1',
        cashflow_id: 'cf-1',
        recurring_rule_id: 'rule-123',
        description: 'Spotify Monthly Fee',
        amount: 19.99,
        type: 'expense',
        category: 'Entertainment',
        date: '2026-03-20',
        is_recurring: true,
        recurrence_interval: 'monthly',
        yearly_calculation: null,
        tags: ['sub'],
        receipt_url: null,
        created_at: '2026-03-20T00:00:00Z',
      }

      const dto = mapCashflowEntryToDTO(dbEntry)
      expect(dto.recurring_rule_id).toBe('rule-123')
      expect(dto.is_recurring).toBe(true)
    })
  })

  describe('Projections with First-Class Rules', () => {
    it('projects future monthly expense from active rule without double-counting settled entry', () => {
      const today = new Date(2026, 2, 10) // March 10, 2026

      const recurringRules: CashflowRecurringRuleDTO[] = [
        {
          id: 'rule-rent',
          cashflow_id: 'cf-1',
          goal_id: null,
          description: 'Apartment Rent',
          amount: 1500,
          type: 'expense',
          category: 'Housing',
          recurrence_interval: 'monthly',
          yearly_calculation: null,
          day_of_month: 1, // Due on 1st of month
          is_active: true,
          start_date: '2026-01-01',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ]

      // March 1st rent was already paid & settled
      const entries: CashflowEntryDTO[] = [
        {
          id: 'entry-mar-1',
          cashflow_id: 'cf-1',
          goal_id: null,
          recurring_rule_id: 'rule-rent',
          description: 'Apartment Rent',
          amount: 1500,
          type: 'expense',
          category: 'Housing',
          date: '2026-03-01',
          is_recurring: true,
          recurrence_interval: 'monthly',
          yearly_calculation: null,
          tags: [],
          created_at: '2026-03-01T00:00:00Z',
        },
      ]

      const result = calculateProjections(entries, today, recurringRules)

      // Settled cash should reflect the -1500 expense
      expect(result.settledCash).toBe(-1500)
      // For upcoming: March is already settled (March 1 <= March 10), so only April rent (1500) is upcoming!
      expect(result.upcomingMonthlyExpenses).toBe(1500)
      expect(result.recurringItems.length).toBe(1)
      expect(result.recurringItems[0].id).toBe('rule-rent')
    })

    it('excludes paused recurring rules from smart projection', () => {
      const today = new Date(2026, 2, 10) // March 10, 2026

      const recurringRules: CashflowRecurringRuleDTO[] = [
        {
          id: 'rule-gym',
          cashflow_id: 'cf-1',
          goal_id: null,
          description: 'Gym Membership',
          amount: 50,
          type: 'expense',
          category: 'Fitness',
          recurrence_interval: 'monthly',
          yearly_calculation: null,
          day_of_month: 25,
          is_active: false, // PAUSED
          start_date: '2026-01-01',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ]

      const result = calculateProjections([], today, recurringRules)
      expect(result.upcomingMonthlyExpenses).toBe(0)
      expect(result.recurringItems.length).toBe(0)
    })

    it('preserves recurring projection when a one-off entry has a different or renamed description', () => {
      const today = new Date(2026, 2, 10)

      const recurringRules: CashflowRecurringRuleDTO[] = [
        {
          id: 'rule-sub',
          cashflow_id: 'cf-1',
          goal_id: null,
          description: 'Cloud Server',
          amount: 40,
          type: 'expense',
          category: 'Hosting',
          recurrence_interval: 'monthly',
          yearly_calculation: null,
          day_of_month: 20,
          is_active: true,
          start_date: '2026-01-01',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ]

      // Renamed or one-off manual entry with a completely different description
      const entries: CashflowEntryDTO[] = [
        {
          id: 'manual-1',
          cashflow_id: 'cf-1',
          goal_id: null,
          recurring_rule_id: null,
          description: 'Cloud Server One-Off Addon',
          amount: 10,
          type: 'expense',
          category: 'Hosting',
          date: '2026-03-05',
          is_recurring: false,
          recurrence_interval: null,
          yearly_calculation: null,
          tags: [],
          created_at: '2026-03-05T00:00:00Z',
        },
      ]

      const result = calculateProjections(entries, today, recurringRules)

      // Rule is untouched: March 20 (not passed yet) + April 20 = 2 months = $80
      expect(result.upcomingMonthlyExpenses).toBe(80)
      expect(result.recurringItems[0].description).toBe('Cloud Server')
    })
  })
})
