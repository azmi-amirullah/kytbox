import { describe, expect, it } from 'vitest'
import { parseDateOnly, formatAppDate } from '@/lib/date-only'

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

describe('formatAppDate', () => {
  it('formats YYYY-MM-DD date string to dd MMM yyyy', () => {
    expect(formatAppDate('2026-08-25')).toBe('25 Aug 2026')
    expect(formatAppDate('2026-01-01')).toBe('01 Jan 2026')
  })

  it('formats Date object to dd MMM yyyy', () => {
    const date = new Date(2026, 7, 25)
    expect(formatAppDate(date)).toBe('25 Aug 2026')
  })

  it('returns fallback for null or empty values', () => {
    expect(formatAppDate(null)).toBe('-')
    expect(formatAppDate(undefined)).toBe('-')
    expect(formatAppDate('', 'N/A')).toBe('N/A')
  })
})
