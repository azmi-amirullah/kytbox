import { describe, expect, it } from 'vitest'
import { parseDateOnly } from '@/lib/date-only'

describe('parseDateOnly', () => {
  it('keeps a date-only value on its calendar day', () => {
    const date = parseDateOnly('2026-01-01')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(1)
  })

  it('falls back to normal parsing for non-date-only values', () => {
    expect(parseDateOnly('2026-01-01T12:00:00Z').toISOString()).toBe(
      '2026-01-01T12:00:00.000Z',
    )
  })
})
