import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/search', () => ({
  globalSearch: vi.fn(),
}))

import { commandFilter, getFirstResultValue } from '@/components/command-palette'
import type { GlobalSearchResult } from '@/features/search'

describe('commandFilter', () => {
  it('returns 1 for exact or substring matches', () => {
    const score = commandFilter('Uang Keamanan Pengeluaran Bulanan', 'keam')
    expect(score).toBe(1)
  })

  it('returns > 0 for word prefix matches', () => {
    const score = commandFilter('Support help tickets contact customer service', 'supp')
    expect(score).toBeGreaterThan(0)
  })

  it('rejects scattered character sequence matches across unrelated words', () => {
    // Under default cmdk fuzzy matching, "keam" matches "ticK-Ets contAct custoMer"
    // With commandFilter, this must return 0 to prevent false-positive routing to Support.
    const score = commandFilter('Support help tickets contact customer service', 'keam')
    expect(score).toBe(0)
  })

  it('returns 1 when search query is empty', () => {
    expect(commandFilter('Bio Dashboard', '')).toBe(1)
    expect(commandFilter('Bio Dashboard', '   ')).toBe(1)
  })

  it('supports multi-word searches', () => {
    const score = commandFilter('Add Cashflow Entry transaction expense income', 'add cash')
    expect(score).toBeGreaterThan(0)
  })
})

describe('getFirstResultValue', () => {
  it('returns null when results object is null or empty', () => {
    expect(getFirstResultValue(null)).toBeNull()
    expect(
      getFirstResultValue({
        bio: [],
        cashflow: [],
        list: [],
        support: [],
        invoice: [],
      }),
    ).toBeNull()
  })

  it('returns formatted value of first item based on category priority', () => {
    const results: GlobalSearchResult = {
      bio: [],
      cashflow: [
        {
          id: 'entry-123',
          title: 'Uang Keamanan',
          subtitle: 'Pengeluaran Bulanan · -40000 · utilities · 15 Sep 2026',
          href: '/cashflow/123',
          category: 'cashflow',
          icon: 'wallet',
        },
        {
          id: 'entry-124',
          title: 'Uang Keamanan',
          subtitle: 'Pengeluaran Bulanan · -40000 · utilities · 15 Aug 2026',
          href: '/cashflow/124',
          category: 'cashflow',
          icon: 'wallet',
        },
      ],
      list: [],
      support: [],
      invoice: [],
    }

    const firstValue = getFirstResultValue(results)
    expect(firstValue).toBe(
      'Uang Keamanan Pengeluaran Bulanan · -40000 · utilities · 15 Sep 2026 entry-123',
    )
  })

  it('prioritizes earlier categories over later ones', () => {
    const results: GlobalSearchResult = {
      bio: [
        {
          id: 'bio-1',
          title: 'Twitter Bio',
          subtitle: 'https://twitter.com',
          href: '/bio',
          category: 'bio',
          icon: 'link',
        },
      ],
      cashflow: [
        {
          id: 'entry-1',
          title: 'Cashflow Item',
          subtitle: '50000',
          href: '/cashflow',
          category: 'cashflow',
          icon: 'wallet',
        },
      ],
      list: [],
      support: [],
      invoice: [],
    }

    expect(getFirstResultValue(results)).toBe('Twitter Bio https://twitter.com bio-1')
  })
})
