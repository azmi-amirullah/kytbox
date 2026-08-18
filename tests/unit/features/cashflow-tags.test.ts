import { describe, it, expect } from 'vitest'
import {
  renameCashflowTagSchema,
  deleteCashflowTagSchema,
} from '@/features/cashflow/schemas.server'

describe('Cashflow Tag Management Schemas', () => {
  it('validates rename tag input with valid UUID and strings', () => {
    const parsed = renameCashflowTagSchema.safeParse({
      cashflowId: '11111111-1111-4111-8111-111111111111',
      oldTag: 'keamann',
      newTag: 'Keamanan',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.oldTag).toBe('keamann')
      expect(parsed.data.newTag).toBe('Keamanan')
    }
  })

  it('rejects empty or overly long newTag during rename', () => {
    const emptyResult = renameCashflowTagSchema.safeParse({
      cashflowId: '11111111-1111-4111-8111-111111111111',
      oldTag: 'keamann',
      newTag: '   ',
    })
    expect(emptyResult.success).toBe(false)

    const tooLongResult = renameCashflowTagSchema.safeParse({
      cashflowId: '11111111-1111-4111-8111-111111111111',
      oldTag: 'keamann',
      newTag: 'a'.repeat(31),
    })
    expect(tooLongResult.success).toBe(false)
  })

  it('validates delete tag input', () => {
    const parsed = deleteCashflowTagSchema.safeParse({
      cashflowId: '11111111-1111-4111-8111-111111111111',
      tag: 'Keamanan',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.tag).toBe('Keamanan')
    }
  })

  it('rejects invalid cashflow ID for delete tag', () => {
    const parsed = deleteCashflowTagSchema.safeParse({
      cashflowId: 'not-a-uuid',
      tag: 'Keamanan',
    })
    expect(parsed.success).toBe(false)
  })
})

describe('Slot-Filling Color Allocation Engine', () => {
  it('allocates index 0 when no tags exist', async () => {
    const { getNextAvailableColorIndex } = await import(
      '@/features/cashflow/lib/tag-colors'
    )
    expect(getNextAvailableColorIndex([])).toBe(0)
  })

  it('allocates colors sequentially for the first 12 tags', async () => {
    const { getNextAvailableColorIndex } = await import(
      '@/features/cashflow/lib/tag-colors'
    )
    const tags: { color_index: number }[] = []
    for (let i = 0; i < 12; i++) {
      expect(getNextAvailableColorIndex(tags)).toBe(i)
      tags.push({ color_index: i })
    }
  })

  it('loops back to 0 only after all 12 colors are used', async () => {
    const { getNextAvailableColorIndex } = await import(
      '@/features/cashflow/lib/tag-colors'
    )
    const all12 = Array.from({ length: 12 }, (_, i) => ({ color_index: i }))
    expect(getNextAvailableColorIndex(all12)).toBe(0)

    const all12Plus0 = [...all12, { color_index: 0 }]
    expect(getNextAvailableColorIndex(all12Plus0)).toBe(1)
  })

  it('reuses deleted/missing slots from first loop before duplicating', async () => {
    const { getNextAvailableColorIndex } = await import(
      '@/features/cashflow/lib/tag-colors'
    )
    // Slot 2 was deleted (tags have indices 0, 1, 3, 4, 5)
    const tagsWithGap = [
      { color_index: 0 },
      { color_index: 1 },
      { color_index: 3 },
      { color_index: 4 },
      { color_index: 5 },
    ]
    expect(getNextAvailableColorIndex(tagsWithGap)).toBe(2)
  })

  it('prioritizes unused first-loop slots even if other slots have multiple usages', async () => {
    const { getNextAvailableColorIndex } = await import(
      '@/features/cashflow/lib/tag-colors'
    )
    // Slot 4 has count 0, whereas all others have count >= 1 or 2
    const complexBook = [
      { color_index: 0 }, { color_index: 0 },
      { color_index: 1 },
      { color_index: 2 }, { color_index: 2 },
      { color_index: 3 },
      // slot 4 is missing!
      { color_index: 5 },
      { color_index: 6 },
      { color_index: 7 },
      { color_index: 8 },
      { color_index: 9 },
      { color_index: 10 },
      { color_index: 11 },
    ]
    expect(getNextAvailableColorIndex(complexBook)).toBe(4)
  })

  it('resolves tag color from bookTags correctly and falls back deterministically', async () => {
    const { resolveTagColor, TAG_COLORS } = await import(
      '@/features/cashflow/lib/tag-colors'
    )
    const bookTags = [
      {
        id: '1',
        cashflow_id: 'cf-1',
        name: 'SP',
        color_index: 0,
        created_at: '2026-08-18T00:00:00Z',
      },
      {
        id: '2',
        cashflow_id: 'cf-1',
        name: 'zxc',
        color_index: 1,
        created_at: '2026-08-18T00:01:00Z',
      },
    ]

    expect(resolveTagColor('SP', bookTags)).toBe(TAG_COLORS[0])
    expect(resolveTagColor('zxc', bookTags)).toBe(TAG_COLORS[1])
    // Case insensitive match
    expect(resolveTagColor('sp', bookTags)).toBe(TAG_COLORS[0])
  })
})
