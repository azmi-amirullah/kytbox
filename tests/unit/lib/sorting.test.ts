import { describe, it, expect } from 'vitest'
import { sortEntities } from '@/lib/sorting'

interface TestItem {
  id: string
  title: string
  created_at: string
  last_entry_at?: string | null
  balance: number
}

describe('sortEntities utility', () => {
  const items: TestItem[] = [
    {
      id: '1',
      title: 'Zebra Personal',
      created_at: '2026-01-01T00:00:00Z',
      last_entry_at: '2026-08-30T00:00:00Z',
      balance: 100,
    },
    {
      id: '2',
      title: 'Alpha Business',
      created_at: '2026-05-01T00:00:00Z',
      last_entry_at: '2026-06-01T00:00:00Z',
      balance: 5000,
    },
    {
      id: '3',
      title: 'Beta Trip',
      created_at: '2026-08-01T00:00:00Z',
      last_entry_at: '2026-08-15T00:00:00Z',
      balance: -250,
    },
  ]

  it('sorts by last_activity descending', () => {
    const sorted = sortEntities(items, 'last_activity')
    expect(sorted.map((i) => i.id)).toEqual(['1', '3', '2'])
  })

  it('sorts by created_desc descending', () => {
    const sorted = sortEntities(items, 'created_desc')
    expect(sorted.map((i) => i.id)).toEqual(['3', '2', '1'])
  })

  it('sorts by created_asc ascending', () => {
    const sorted = sortEntities(items, 'created_asc')
    expect(sorted.map((i) => i.id)).toEqual(['1', '2', '3'])
  })

  it('sorts by title_asc alphabetically (A-Z)', () => {
    const sorted = sortEntities(items, 'title_asc')
    expect(sorted.map((i) => i.id)).toEqual(['2', '3', '1'])
  })

  it('sorts by metric_desc (e.g. balance highest to lowest)', () => {
    const sorted = sortEntities(items, 'metric_desc')
    expect(sorted.map((i) => i.id)).toEqual(['2', '1', '3'])
  })

  it('handles empty or missing timestamps gracefully', () => {
    const mixed: TestItem[] = [
      { id: 'a', title: 'A', created_at: '', last_entry_at: null, balance: 0 },
      {
        id: 'b',
        title: 'B',
        created_at: '2026-08-01T00:00:00Z',
        last_entry_at: '2026-08-02T00:00:00Z',
        balance: 10,
      },
    ]
    const sorted = sortEntities(mixed, 'last_activity')
    expect(sorted.map((i) => i.id)).toEqual(['b', 'a'])
  })
})
