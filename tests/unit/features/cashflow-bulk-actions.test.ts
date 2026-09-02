import { describe, it, expect } from 'vitest'
import {
  bulkDeleteCashflowEntriesSchema,
  bulkUpdateCashflowCategorySchema,
  bulkAddCashflowTagsSchema,
} from '@/features/cashflow/schemas.server'
import {
  bulkDeleteClientSchema,
  bulkUpdateCategoryClientSchema,
  bulkAddTagsClientSchema,
} from '@/features/cashflow/schemas.client'

describe('Cashflow Bulk Actions Schemas', () => {
  const validCashflowId = '123e4567-e89b-12d3-a456-426614174000'
  const validEntryId1 = '123e4567-e89b-12d3-a456-426614174001'
  const validEntryId2 = '123e4567-e89b-12d3-a456-426614174002'

  describe('bulkDeleteCashflowEntriesSchema', () => {
    it('accepts valid cashflowId and entryIds', () => {
      const result = bulkDeleteCashflowEntriesSchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1, validEntryId2],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cashflowId).toBe(validCashflowId)
        expect(result.data.entryIds).toHaveLength(2)
      }
    })

    it('rejects empty entryIds array', () => {
      const result = bulkDeleteCashflowEntriesSchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one entry must be selected')
      }
    })

    it('rejects invalid UUIDs', () => {
      const result = bulkDeleteCashflowEntriesSchema.safeParse({
        cashflowId: 'not-a-uuid',
        entryIds: [validEntryId1],
      })
      expect(result.success).toBe(false)

      const result2 = bulkDeleteCashflowEntriesSchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: ['invalid-entry-uuid'],
      })
      expect(result2.success).toBe(false)
    })

    it('rejects batch size exceeding 100 entries', () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) =>
        `123e4567-e89b-12d3-a456-${String(i).padStart(12, '0')}`,
      )
      const result = bulkDeleteCashflowEntriesSchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: tooManyIds,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 100 entries per batch')
      }
    })
  })

  describe('bulkUpdateCashflowCategorySchema', () => {
    it('accepts valid category reassignment', () => {
      const result = bulkUpdateCashflowCategorySchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1],
        category: 'Food',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe('Food')
      }
    })

    it('transforms empty string or null category to null (uncategorized)', () => {
      const result1 = bulkUpdateCashflowCategorySchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1],
        category: '',
      })
      expect(result1.success).toBe(true)
      if (result1.success) {
        expect(result1.data.category).toBeNull()
      }

      const result2 = bulkUpdateCashflowCategorySchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1],
        category: null,
      })
      expect(result2.success).toBe(true)
      if (result2.success) {
        expect(result2.data.category).toBeNull()
      }
    })

    it('rejects categories longer than 50 characters', () => {
      const result = bulkUpdateCashflowCategorySchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1],
        category: 'A'.repeat(51),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Category too long')
      }
    })
  })

  describe('bulkAddCashflowTagsSchema', () => {
    it('accepts and sanitizes tags (stripping # prefixes and whitespace)', () => {
      const result = bulkAddCashflowTagsSchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1, validEntryId2],
        tags: ['#TaxDeductible', ' Vacation ', '#2026'],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags).toEqual(['TaxDeductible', 'Vacation', '2026'])
      }
    })

    it('rejects empty tags list', () => {
      const result = bulkAddCashflowTagsSchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1],
        tags: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one tag required')
      }
    })

    it('rejects more than 10 tags in a single batch', () => {
      const tooManyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
      const result = bulkAddCashflowTagsSchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1],
        tags: tooManyTags,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 10 tags per batch')
      }
    })

    it('rejects tags longer than 30 characters', () => {
      const result = bulkAddCashflowTagsSchema.safeParse({
        cashflowId: validCashflowId,
        entryIds: [validEntryId1],
        tags: ['A'.repeat(31)],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Client Bulk Schemas', () => {
    it('validates client bulk delete schema', () => {
      const res = bulkDeleteClientSchema.safeParse({
        cashflowId: 'any-id',
        entryIds: ['id1', 'id2'],
      })
      expect(res.success).toBe(true)
    })

    it('validates client bulk update category schema', () => {
      const res = bulkUpdateCategoryClientSchema.safeParse({
        cashflowId: 'any-id',
        entryIds: ['id1'],
        category: 'Food',
      })
      expect(res.success).toBe(true)
    })

    it('validates client bulk add tags schema', () => {
      const res = bulkAddTagsClientSchema.safeParse({
        cashflowId: 'any-id',
        entryIds: ['id1'],
        tags: ['groceries', 'supermarket'],
      })
      expect(res.success).toBe(true)
    })
  })

  describe('Tag Merging Logic', () => {
    it('merges new tags into existing tags without duplicates and caps at 10', () => {
      const existingTags = ['food', 'groceries']
      const newTags = ['Groceries', 'receipt', 'household', 'urgent']
      const cleanNewTags = newTags.map((t) => t.trim().replace(/^#/, '')).filter(Boolean)

      const mergedMap = new Map<string, string>()
      for (const t of existingTags) {
        if (typeof t === 'string' && t.trim()) {
          mergedMap.set(t.trim().toLowerCase(), t.trim())
        }
      }
      for (const t of cleanNewTags) {
        if (!mergedMap.has(t.toLowerCase())) {
          mergedMap.set(t.toLowerCase(), t)
        }
      }
      const mergedTags = Array.from(mergedMap.values()).slice(0, 10)

      expect(mergedTags).toEqual(['food', 'groceries', 'receipt', 'household', 'urgent'])
      expect(mergedTags).toHaveLength(5)
    })
  })
})
