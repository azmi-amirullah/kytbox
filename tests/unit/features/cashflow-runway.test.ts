import { describe, it, expect } from 'vitest'
import { calculateRunway } from '@/features/cashflow/lib/runway'
import type { CashflowEntryDTO } from '@/types/dto'

describe('Cashflow Runway & Burn Rate Engine (The Survival Clock)', () => {
  const fixedRefDate = new Date(2026, 8, 15) // Sep 15, 2026

  const createEntry = (
    id: string,
    type: 'income' | 'expense',
    amount: number,
    date: string,
  ): CashflowEntryDTO => ({
    id,
    cashflow_id: 'cf-1',
    goal_id: null,
    description: `Test ${type}`,
    amount,
    type,
    category: type === 'income' ? 'Salary' : 'Food',
    date,
    created_at: '2026-09-01T00:00:00Z',
    is_recurring: false,
    recurrence_interval: null,
    yearly_calculation: null,
    tags: [],
  })

  it('calculates 90-day gross and net burn rates accurately', () => {
    // 90-day window from Sep 15, 2026: June 18, 2026 to Sep 15, 2026
    const entries: CashflowEntryDTO[] = [
      createEntry('e1', 'expense', 900, '2026-09-01'), // in window
      createEntry('e2', 'expense', 1800, '2026-08-01'), // in window
      createEntry('e3', 'income', 3000, '2026-08-15'), // in window
      createEntry('e4', 'expense', 5000, '2026-01-01'), // OUT of window (too old)
      createEntry('e5', 'expense', 1000, '2026-09-20'), // OUT of window (in future)
    ]

    const result = calculateRunway({
      balance: 5400,
      entries,
      windowDays: 90,
      referenceDate: fixedRefDate,
    })

    expect(result.windowDays).toBe(90)
    expect(result.entryCount).toBe(3)
    expect(result.totalExpense).toBe(2700)
    expect(result.totalIncome).toBe(3000)

    // Daily gross burn: 2700 / 90 = 30
    expect(result.dailyGrossBurn).toBe(30)
    // Monthly gross burn: 30 * 30.4375 = 913.125
    expect(result.monthlyGrossBurn).toBeCloseTo(913.125, 2)

    // Net burn: 2700 - 3000 = -300 in 90 days => profitable
    expect(result.isProfitable).toBe(true)
    expect(result.status).toBe('profitable')
    expect(result.netRunwayMonths).toBe(Number.POSITIVE_INFINITY)

    // Zero-income runway (if all income stops): 5400 / 913.125 ~= 5.9 months
    expect(result.zeroIncomeRunwayMonths).toBeCloseTo(5.9, 1)
    expect(result.zeroIncomeRunwayDays).toBe(Math.floor(5400 / 30)) // 180 days
    expect(result.projectedZeroDate).toBeDefined()
  })

  it('handles critical runway (< 3 months) when expenses exceed income and balance is low', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry('e1', 'expense', 3000, '2026-09-05'),
    ]

    const result = calculateRunway({
      balance: 1500,
      entries,
      windowDays: 30,
      referenceDate: fixedRefDate,
    })

    expect(result.windowDays).toBe(30)
    expect(result.dailyGrossBurn).toBe(100) // 3000 / 30
    expect(result.monthlyGrossBurn).toBeCloseTo(3043.75, 2)
    // Zero-income runway: 1500 / 3043.75 ~= 0.5 months
    expect(result.zeroIncomeRunwayMonths).toBe(0.5)
    expect(result.zeroIncomeRunwayDays).toBe(15)
    expect(result.status).toBe('critical')
    expect(result.isProfitable).toBe(false)
  })

  it('handles moderate runway (3 to 6 months)', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry('e1', 'expense', 3000, '2026-09-01'), // 3000 in 30 days => ~3043/mo
    ]

    const result = calculateRunway({
      balance: 12000, // 12000 / 3043.75 ~= 3.9 months
      entries,
      windowDays: 30,
      referenceDate: fixedRefDate,
    })

    expect(result.zeroIncomeRunwayMonths).toBe(3.9)
    expect(result.status).toBe('moderate')
  })

  it('handles healthy runway (>= 6 months) when in deficit', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry('e1', 'expense', 3000, '2026-09-01'),
      createEntry('e2', 'income', 1000, '2026-09-01'), // net burn is positive (deficit)
    ]

    const result = calculateRunway({
      balance: 25000, // 25000 / 3043.75 ~= 8.2 months
      entries,
      windowDays: 30,
      referenceDate: fixedRefDate,
    })

    expect(result.isProfitable).toBe(false)
    expect(result.zeroIncomeRunwayMonths).toBe(8.2)
    expect(result.status).toBe('healthy')
  })

  it('handles depleted or negative balance', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry('e1', 'expense', 500, '2026-09-10'),
    ]

    const result = calculateRunway({
      balance: -100,
      entries,
      windowDays: 30,
      referenceDate: fixedRefDate,
    })

    expect(result.zeroIncomeRunwayMonths).toBe(0)
    expect(result.zeroIncomeRunwayDays).toBe(0)
    expect(result.netRunwayMonths).toBe(0)
    expect(result.status).toBe('depleted')
    expect(result.projectedZeroDate).toBeNull()
  })

  it('handles zero expenses cleanly without division by zero', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry('e1', 'income', 2000, '2026-09-01'),
    ]

    const result = calculateRunway({
      balance: 5000,
      entries,
      windowDays: 60,
      referenceDate: fixedRefDate,
    })

    expect(result.dailyGrossBurn).toBe(0)
    expect(result.monthlyGrossBurn).toBe(0)
    expect(result.zeroIncomeRunwayMonths).toBe(Number.POSITIVE_INFINITY)
    expect(result.zeroIncomeRunwayDays).toBe(Number.POSITIVE_INFINITY)
    expect(result.projectedZeroDate).toBeNull()
    expect(result.status).toBe('profitable')
  })

  it('correctly shifts window when toggling between 30, 60, and 90 days', () => {
    const entries: CashflowEntryDTO[] = [
      createEntry('e1', 'expense', 1000, '2026-09-10'), // in 30, 60, 90
      createEntry('e2', 'expense', 1000, '2026-08-01'), // in 60, 90 (45 days ago)
      createEntry('e3', 'expense', 1000, '2026-07-01'), // in 90 (76 days ago)
    ]

    const res30 = calculateRunway({
      balance: 10000,
      entries,
      windowDays: 30,
      referenceDate: fixedRefDate,
    })
    expect(res30.entryCount).toBe(1)
    expect(res30.totalExpense).toBe(1000)

    const res60 = calculateRunway({
      balance: 10000,
      entries,
      windowDays: 60,
      referenceDate: fixedRefDate,
    })
    expect(res60.entryCount).toBe(2)
    expect(res60.totalExpense).toBe(2000)

    const res90 = calculateRunway({
      balance: 10000,
      entries,
      windowDays: 90,
      referenceDate: fixedRefDate,
    })
    expect(res90.entryCount).toBe(3)
    expect(res90.totalExpense).toBe(3000)
  })
})
