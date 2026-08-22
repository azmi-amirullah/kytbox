import { describe, it, expect } from 'vitest'
import {
  cashflowEntrySchema,
  updateCashflowEntrySchema,
  getReceiptSignedUrlSchema,
} from '@/features/cashflow/schemas.server'
import { mapCashflowEntryToDTO } from '@/lib/mappers'
import type { CashflowEntry } from '@/types/database'

describe('Cashflow Receipt Schemas & Logic', () => {
  describe('cashflowEntrySchema receiptAction', () => {
    it('defaults receiptAction to keep when unspecified', () => {
      const result = cashflowEntrySchema.safeParse({
        description: 'Starbucks Coffee',
        amount: '4.50',
        type: 'expense',
        date: '2026-08-18',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.receiptAction).toBe('keep')
      }
    })

    it('accepts explicit upload and remove actions', () => {
      const uploadResult = cashflowEntrySchema.safeParse({
        description: 'Office Supplies',
        amount: '120.00',
        type: 'expense',
        date: '2026-08-18',
        receiptAction: 'upload',
      })
      expect(uploadResult.success).toBe(true)
      if (uploadResult.success) {
        expect(uploadResult.data.receiptAction).toBe('upload')
      }

      const removeResult = updateCashflowEntrySchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        description: 'Office Supplies',
        amount: '120.00',
        type: 'expense',
        date: '2026-08-18',
        receiptAction: 'remove',
      })
      expect(removeResult.success).toBe(true)
      if (removeResult.success) {
        expect(removeResult.data.receiptAction).toBe('remove')
      }
    })

    it('rejects invalid receiptAction values', () => {
      const invalidResult = cashflowEntrySchema.safeParse({
        description: 'Invalid Action',
        amount: '50.00',
        type: 'expense',
        date: '2026-08-18',
        receiptAction: 'invalid_action',
      })
      expect(invalidResult.success).toBe(false)
    })
  })

  describe('getReceiptSignedUrlSchema', () => {
    it('validates valid cashflowId and entryId UUIDs', () => {
      const valid = getReceiptSignedUrlSchema.safeParse({
        cashflowId: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
        entryId: 'b2c3d4e5-f6a7-4b8c-9d0e-123456789abc',
      })
      expect(valid.success).toBe(true)
    })

    it('rejects malformed UUIDs', () => {
      const invalid = getReceiptSignedUrlSchema.safeParse({
        cashflowId: 'not-a-uuid',
        entryId: '123',
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe('mapCashflowEntryToDTO receipt_url mapping', () => {
    it('correctly maps receipt_url when present', () => {
      const mockRow: CashflowEntry = {
        id: 'entry-1',
        cashflow_id: 'cf-1',
        description: 'Client Lunch',
        amount: 85.5,
        type: 'expense',
        category: 'Food',
        date: '2026-08-18',
        created_at: '2026-08-18T10:00:00Z',
        is_recurring: false,
        recurrence_interval: null,
        yearly_calculation: null,
        goal_id: null,
        tags: ['ClientA'],
        receipt_url: 'user-1/cf-1/receipt-xyz.webp',
      }

      const dto = mapCashflowEntryToDTO(mockRow)
      expect(dto.receipt_url).toBe('user-1/cf-1/receipt-xyz.webp')
    })

    it('maps null receipt_url when absent', () => {
      const mockRow: CashflowEntry = {
        id: 'entry-2',
        cashflow_id: 'cf-1',
        description: 'Software Subscription',
        amount: 29.0,
        type: 'expense',
        category: 'Software',
        date: '2026-08-18',
        created_at: '2026-08-18T10:00:00Z',
        is_recurring: true,
        recurrence_interval: 'monthly',
        yearly_calculation: null,
        goal_id: null,
        tags: [],
        receipt_url: null,
      }

      const dto = mapCashflowEntryToDTO(mockRow)
      expect(dto.receipt_url).toBeNull()
    })
  })

  describe('image format detection (isSupportedImageFile)', () => {
    it('identifies standard web images and rejects unsupported files', async () => {
      const { isSupportedImageFile } = await import(
        '@/features/cashflow/lib/image-compression'
      )

      const jpegFile = new File(['mock-data'], 'receipt.jpg', {
        type: 'image/jpeg',
      })
      const pngFile = new File(['mock-data'], 'receipt.png', {
        type: 'image/png',
      })
      const webpFile = new File(['mock-data'], 'receipt.webp', {
        type: 'image/webp',
      })
      const txtFile = new File(['mock-data'], 'notes.txt', {
        type: 'text/plain',
      })
      const pdfFile = new File(['mock-data'], 'invoice.pdf', {
        type: 'application/pdf',
      })

      expect(isSupportedImageFile(jpegFile)).toBe(true)
      expect(isSupportedImageFile(pngFile)).toBe(true)
      expect(isSupportedImageFile(webpFile)).toBe(true)
      expect(isSupportedImageFile(txtFile)).toBe(false)
      expect(isSupportedImageFile(pdfFile)).toBe(false)
    })
  })
})

