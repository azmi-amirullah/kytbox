import { describe, it, expect } from 'vitest'
import {
  archiveCashflowSchema,
  restoreCashflowSchema,
  toggleCashflowPinSchema,
} from '@/features/cashflow/schemas.server'
import { sortEntities } from '@/lib/sorting'
import type { CashflowWithSummaryDTO } from '@/types/dto'

describe('Cashflow Book Organization & Lifecycle', () => {
  const currentUserId = 'user-123'

  const mockBooks: CashflowWithSummaryDTO[] = [
    {
      id: 'book-1',
      title: 'Zebra Everyday Budget',
      is_public: false,
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
      last_entry_at: '2026-08-30T10:00:00Z',
      entryCount: 150,
      income: 5000,
      expense: 2000,
      balance: 3000,
      isPinned: true,
      isArchived: false,
      isIncluded: true,
    },
    {
      id: 'book-2',
      title: 'Alpha Freelance',
      is_public: false,
      user_id: 'user-123',
      created_at: '2025-06-01T00:00:00Z',
      last_entry_at: '2026-08-10T10:00:00Z',
      entryCount: 40,
      income: 12000,
      expense: 3000,
      balance: 9000,
      isPinned: false,
      isArchived: false,
      isIncluded: true,
    },
    {
      id: 'book-3',
      title: 'Japan Vacation 2025 (Finished)',
      is_public: false,
      user_id: 'user-123',
      created_at: '2025-09-01T00:00:00Z',
      last_entry_at: '2025-10-01T10:00:00Z',
      entryCount: 25,
      income: 4000,
      expense: 4000,
      balance: 0,
      isPinned: false,
      isArchived: true,
      isIncluded: false,
    },
    {
      id: 'book-4-shared',
      title: 'Shared Startup Fund',
      is_public: false,
      user_id: 'user-456',
      created_at: '2026-02-01T00:00:00Z',
      last_entry_at: '2026-08-28T10:00:00Z',
      entryCount: 80,
      income: 20000,
      expense: 8000,
      balance: 12000,
      isPinned: true,
      isArchived: false,
      isIncluded: true,
    },
  ]

  it('correctly partitions active owned, pinned owned, and archived owned books', () => {
    const owned = mockBooks.filter((b) => b.user_id === currentUserId)
    const activeOwned = owned.filter((b) => !b.isArchived)
    const archivedOwned = owned.filter((b) => b.isArchived)
    const pinnedOwned = activeOwned.filter((b) => b.isPinned)
    const unpinnedOwned = activeOwned.filter((b) => !b.isPinned)

    expect(activeOwned).toHaveLength(2)
    expect(archivedOwned).toHaveLength(1)
    expect(archivedOwned[0].id).toBe('book-3')

    expect(pinnedOwned).toHaveLength(1)
    expect(pinnedOwned[0].id).toBe('book-1')

    expect(unpinnedOwned).toHaveLength(1)
    expect(unpinnedOwned[0].id).toBe('book-2')
  })

  it('sorts books by Last Activity (latest transaction or update first)', () => {
    const activeOwned = mockBooks.filter((b) => b.user_id === currentUserId && !b.isArchived)
    const sorted = sortEntities(activeOwned, 'last_activity')

    // book-1 has last_entry_at on Aug 30, book-2 on Aug 10
    expect(sorted[0].id).toBe('book-1')
    expect(sorted[1].id).toBe('book-2')
  })

  it('sorts books alphabetically (A-Z)', () => {
    const activeOwned = mockBooks.filter((b) => b.user_id === currentUserId && !b.isArchived)
    const sorted = sortEntities(activeOwned, 'title_asc')

    expect(sorted[0].id).toBe('book-2') // "Alpha Freelance"
    expect(sorted[1].id).toBe('book-1') // "Zebra Everyday Budget"
  })

  it('sorts books by Highest Balance', () => {
    const activeOwned = mockBooks.filter((b) => b.user_id === currentUserId && !b.isArchived)
    const sorted = sortEntities(activeOwned, 'metric_desc')

    expect(sorted[0].id).toBe('book-2') // balance 9000
    expect(sorted[1].id).toBe('book-1') // balance 3000
  })

  it('excludes archived books from active financial totals calculations', () => {
    const activeOwned = mockBooks.filter((b) => b.user_id === currentUserId && !b.isArchived)
    const sharedActive = mockBooks.filter((b) => b.user_id !== currentUserId && b.isIncluded)

    const flowsToCount = [...activeOwned, ...sharedActive]

    const totalIncome = flowsToCount.reduce((sum, b) => sum + b.income, 0)
    const totalExpense = flowsToCount.reduce((sum, b) => sum + b.expense, 0)
    const balance = totalIncome - totalExpense

    // Active Owned: (5000+12000, 2000+3000) = Income 17000, Expense 5000
    // Shared: (20000, 8000)
    // Total Income = 37000, Total Expense = 13000, Balance = 24000
    expect(totalIncome).toBe(37000)
    expect(totalExpense).toBe(13000)
    expect(balance).toBe(24000)
  })

  describe('Server Action Zod Schemas', () => {
    it('validates toggleCashflowPinSchema', () => {
      const valid = toggleCashflowPinSchema.safeParse({
        cashflowId: '123e4567-e89b-12d3-a456-426614174000',
        isPinned: true,
      })
      expect(valid.success).toBe(true)

      const invalid = toggleCashflowPinSchema.safeParse({
        cashflowId: 'not-a-uuid',
        isPinned: true,
      })
      expect(invalid.success).toBe(false)
    })

    it('validates archiveCashflowSchema', () => {
      const valid = archiveCashflowSchema.safeParse({
        cashflowId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(valid.success).toBe(true)

      const invalid = archiveCashflowSchema.safeParse({
        cashflowId: 'invalid-id',
      })
      expect(invalid.success).toBe(false)
    })

    it('validates restoreCashflowSchema', () => {
      const valid = restoreCashflowSchema.safeParse({
        cashflowId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(valid.success).toBe(true)

      const invalid = restoreCashflowSchema.safeParse({
        cashflowId: '',
      })
      expect(invalid.success).toBe(false)
    })
  })
})
