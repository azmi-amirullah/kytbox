import { describe, it, expect } from 'vitest'
import {
  createVehicleServiceSchema,
  updateVehicleServiceSchema,
  deleteVehicleServiceSchema,
} from '@/features/garage/schemas.server'
import { serviceFormClientSchema } from '@/features/garage/schemas.client'
import { sanitizeInvoiceUrl } from '@/features/garage/lib/invoice-url'
import { predictNextMaintenance } from '@/features/garage/lib/rules-math'
import type { VehicleMaintenanceRuleDTO } from '@/types/dto'

describe('Day 3 Garage: Service & Maintenance Logging Engine', () => {
  const validBase = {
    vehicleId: '123e4567-e89b-12d3-a456-426614174000',
    serviceDate: '2026-09-03',
    odometer: 45000,
    serviceType: 'routine' as const,
    itemsServiced: ['Engine Oil', 'Oil Filter'],
    servicedRuleIds: ['123e4567-e89b-12d3-a456-426614174001'],
    cost: 450000,
    workshopName: 'Honda Authorized Dealer',
    invoiceNumber: 'INV-2026-001',
    externalInvoiceUrl: 'https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing',
    notes: 'Used Shell Helix Ultra 5W-30',
  }

  describe('createVehicleServiceSchema', () => {

    it('successfully parses valid service record input', () => {
      const parsed = createVehicleServiceSchema.parse(validBase)
      expect(parsed.vehicleId).toBe(validBase.vehicleId)
      expect(parsed.serviceDate).toBe('2026-09-03')
      expect(parsed.odometer).toBe(45000)
      expect(parsed.serviceType).toBe('routine')
      expect(parsed.itemsServiced).toEqual(['Engine Oil', 'Oil Filter'])
      expect(parsed.cost).toBe(450000)
      expect(parsed.workshopName).toBe('Honda Authorized Dealer')
      expect(parsed.invoiceNumber).toBe('INV-2026-001')
      expect(parsed.externalInvoiceUrl).toBe(
        'https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing'
      )
    })

    it('handles optional fields and transforms empty strings to null', () => {
      const minimal = {
        vehicleId: '123e4567-e89b-12d3-a456-426614174000',
        serviceDate: '2026-09-03',
        odometer: 10000,
        workshopName: '   ',
        invoiceNumber: '',
        externalInvoiceUrl: '',
        notes: '',
      }
      const parsed = createVehicleServiceSchema.parse(minimal)
      expect(parsed.serviceType).toBe('routine')
      expect(parsed.itemsServiced).toEqual([])
      expect(parsed.servicedRuleIds).toEqual([])
      expect(parsed.cost).toBe(0)
      expect(parsed.workshopName).toBeNull()
      expect(parsed.invoiceNumber).toBeNull()
      expect(parsed.externalInvoiceUrl).toBeNull()
      expect(parsed.notes).toBeNull()
    })

    it('rejects invalid vehicle UUID', () => {
      expect(() =>
        createVehicleServiceSchema.parse({
          ...validBase,
          vehicleId: 'not-a-uuid',
        })
      ).toThrow(/Invalid vehicle ID/)
    })

    it('rejects negative odometer and negative cost', () => {
      expect(() =>
        createVehicleServiceSchema.parse({
          ...validBase,
          odometer: -50,
        })
      ).toThrow(/Odometer cannot be negative/)

      expect(() =>
        createVehicleServiceSchema.parse({
          ...validBase,
          cost: -100,
        })
      ).toThrow(/Cost cannot be negative/)
    })

    it('rejects malformed dates', () => {
      expect(() =>
        createVehicleServiceSchema.parse({
          ...validBase,
          serviceDate: '09-03-2026',
        })
      ).toThrow(/Invalid date format/)
    })

    it('rejects dangerous invoice URL schemes like javascript:', () => {
      expect(() =>
        createVehicleServiceSchema.parse({
          ...validBase,
          externalInvoiceUrl: 'javascript:alert(1)',
        })
      ).toThrow(/Invalid URL format/)
    })

    it('correctly defaults and parses confirmTypoJump', () => {
      const parsedDefault = createVehicleServiceSchema.parse(validBase)
      expect(parsedDefault.confirmTypoJump).toBe(false)

      const parsedConfirmed = createVehicleServiceSchema.parse({
        ...validBase,
        confirmTypoJump: true,
      })
      expect(parsedConfirmed.confirmTypoJump).toBe(true)
    })
  })

  describe('serviceFormClientSchema', () => {
    it('correctly handles Cashflow sync fields on server and client', () => {
      const withCashflow = {
        ...validBase,
        recordToCashflow: true,
        cashflowId: '123e4567-e89b-12d3-a456-426614174999',
        cashflowCategory: 'transport',
        cashflowCategoryId: 'cat-123',
      }
      const parsedServer = createVehicleServiceSchema.parse(withCashflow)
      expect(parsedServer.recordToCashflow).toBe(true)
      expect(parsedServer.cashflowId).toBe('123e4567-e89b-12d3-a456-426614174999')
      expect(parsedServer.cashflowCategory).toBe('transport')
      expect(parsedServer.cashflowCategoryId).toBe('cat-123')

      const parsedClient = serviceFormClientSchema.parse({
        serviceDate: '2026-09-03',
        odometer: 45000,
        serviceType: 'routine',
        itemsServiced: ['Engine Oil'],
        servicedRuleIds: ['rule-1'],
        cost: 350000,
        recordToCashflow: true,
        cashflowId: '123e4567-e89b-12d3-a456-426614174999',
        cashflowCategory: 'transport',
      })
      expect(parsedClient.recordToCashflow).toBe(true)
      expect(parsedClient.cashflowId).toBe('123e4567-e89b-12d3-a456-426614174999')
    })

    it('validates client-side service form input', () => {
      const clientInput = {
        serviceDate: '2026-09-03',
        odometer: 45000,
        serviceType: 'routine',
        itemsServiced: ['Engine Oil'],
        servicedRuleIds: ['rule-1'],
        cost: 350000,
        workshopName: 'Workshop',
        invoiceNumber: 'INV-1',
        externalInvoiceUrl: null,
        notes: null,
      }
      const parsed = serviceFormClientSchema.parse(clientInput)
      expect(parsed.serviceType).toBe('routine')
      expect(parsed.odometer).toBe(45000)

      const parsedWithJump = serviceFormClientSchema.parse({
        ...clientInput,
        confirmTypoJump: true,
      })
      expect(parsedWithJump.confirmTypoJump).toBe(true)
    })
  })

  describe('deleteVehicleServiceSchema', () => {
    it('validates UUIDs properly and defaults deleteCashflowEntry to false', () => {
      const valid = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        vehicleId: '123e4567-e89b-12d3-a456-426614174001',
      }
      expect(deleteVehicleServiceSchema.parse(valid)).toEqual({
        ...valid,
        deleteCashflowEntry: false,
      })

      expect(
        deleteVehicleServiceSchema.parse({
          ...valid,
          deleteCashflowEntry: true,
        })
      ).toEqual({
        ...valid,
        deleteCashflowEntry: true,
      })

      expect(() =>
        deleteVehicleServiceSchema.parse({ id: 'bad', vehicleId: valid.vehicleId })
      ).toThrow(/Invalid service ID/)
    })
  })

  describe('sanitizeInvoiceUrl', () => {
    it('transforms Google Drive view URL to direct thumbnail stream', () => {
      const driveUrl = 'https://drive.google.com/file/d/1XyZ987AbC/view?usp=sharing'
      const res = sanitizeInvoiceUrl(driveUrl)

      expect(res.isValid).toBe(true)
      expect(res.isDrive).toBe(true)
      expect(res.thumbnailUrl).toBe('https://drive.google.com/thumbnail?id=1XyZ987AbC&sz=w800')
      expect(res.viewUrl).toBe(driveUrl)
    })

    it('transforms Google Drive open ID URL to thumbnail stream', () => {
      const driveOpenUrl = 'https://drive.google.com/open?id=1XyZ987AbC'
      const res = sanitizeInvoiceUrl(driveOpenUrl)

      expect(res.isValid).toBe(true)
      expect(res.isDrive).toBe(true)
      expect(res.thumbnailUrl).toBe('https://drive.google.com/thumbnail?id=1XyZ987AbC&sz=w800')
    })

    it('transforms Dropbox link with dl=0 to raw=1 direct image stream', () => {
      const dropboxUrl = 'https://www.dropbox.com/s/xyz123/receipt.jpg?dl=0'
      const res = sanitizeInvoiceUrl(dropboxUrl)

      expect(res.isValid).toBe(true)
      expect(res.isDropbox).toBe(true)
      expect(res.thumbnailUrl).toContain('raw=1')
      expect(res.thumbnailUrl).not.toContain('dl=0')
    })

    it('handles direct image URLs with image preview', () => {
      const imgUrl = 'https://example.com/invoices/receipt_123.webp'
      const res = sanitizeInvoiceUrl(imgUrl)

      expect(res.isValid).toBe(true)
      expect(res.isDirectImage).toBe(true)
      expect(res.thumbnailUrl).toBe(imgUrl)
    })

    it('handles generic web links without thumbnail', () => {
      const webUrl = 'https://portal.workshop.com/invoices/992'
      const res = sanitizeInvoiceUrl(webUrl)

      expect(res.isValid).toBe(true)
      expect(res.isDrive).toBe(false)
      expect(res.thumbnailUrl).toBeNull()
      expect(res.viewUrl).toBe(webUrl)
    })

    it('safely rejects invalid or dangerous URLs', () => {
      expect(sanitizeInvoiceUrl(null).isValid).toBe(false)
      expect(sanitizeInvoiceUrl('').isValid).toBe(false)
      expect(sanitizeInvoiceUrl('javascript:alert(1)').isValid).toBe(false)
      expect(sanitizeInvoiceUrl('data:text/html,bad').isValid).toBe(false)
      expect(sanitizeInvoiceUrl('not-a-valid-url').isValid).toBe(false)
    })
  })

  describe('predictNextMaintenance', () => {
    const baseRule: VehicleMaintenanceRuleDTO = {
      id: 'rule-1',
      vehicle_id: 'veh-1',
      name: 'Engine Oil',
      category: 'fluids',
      interval_distance: 5000,
      interval_months: 6,
      last_service_odometer: 40000,
      last_service_date: '2026-03-01',
      is_active: true,
      created_at: '2026-03-01T00:00:00Z',
    }

    it('returns untracked when rules array is empty', () => {
      const pred = predictNextMaintenance([], { currentOdometer: 42000 })
      expect(pred.status).toBe('untracked')
      expect(pred.overdueCount).toBe(0)
      expect(pred.dueSoonCount).toBe(0)
      expect(pred.mostUrgentRule).toBeNull()
    })

    it('detects OVERDUE when current odometer exceeds interval', () => {
      // 40000 + 5000 = 45000, current = 46000 (1000 km overdue)
      const pred = predictNextMaintenance([baseRule], {
        currentOdometer: 46000,
        nowDate: new Date('2026-04-01'),
      })

      expect(pred.status).toBe('overdue')
      expect(pred.overdueCount).toBe(1)
      expect(pred.mostUrgentRule?.rule.name).toBe('Engine Oil')
      expect(pred.nextDueDistance).toBe(-1000)
    })

    it('detects DUE SOON when remaining distance is within 500 km', () => {
      // 40000 + 5000 = 45000, current = 44800 (200 km remaining <= 500)
      const pred = predictNextMaintenance([baseRule], {
        currentOdometer: 44800,
        nowDate: new Date('2026-04-01'),
      })

      expect(pred.status).toBe('due_soon')
      expect(pred.dueSoonCount).toBe(1)
      expect(pred.overdueCount).toBe(0)
      expect(pred.nextDueDistance).toBe(200)
    })

    it('detects GOOD standing when well within interval', () => {
      // 40000 + 5000 = 45000, current = 41000 (4000 km remaining)
      const pred = predictNextMaintenance([baseRule], {
        currentOdometer: 41000,
        nowDate: new Date('2026-04-01'),
      })

      expect(pred.status).toBe('good')
      expect(pred.goodCount).toBe(1)
      expect(pred.overdueCount).toBe(0)
      expect(pred.dueSoonCount).toBe(0)
      expect(pred.nextDueDistance).toBe(4000)
    })

    it('correctly prioritizes overdue item over good item in multi-rule vehicles', () => {
      const goodRule: VehicleMaintenanceRuleDTO = {
        ...baseRule,
        id: 'rule-2',
        name: 'Coolant Fluid',
        interval_distance: 40000,
        last_service_odometer: 40000, // 40000 + 40000 = 80000 (35000 km remaining)
      }
      const overdueRule: VehicleMaintenanceRuleDTO = {
        ...baseRule,
        id: 'rule-3',
        name: 'Brake Fluid',
        interval_distance: 10000,
        last_service_odometer: 30000, // 30000 + 10000 = 40000 (5000 km overdue at 45000)
      }

      const pred = predictNextMaintenance([goodRule, overdueRule], {
        currentOdometer: 45000,
        nowDate: new Date('2026-04-01'),
      })

      expect(pred.status).toBe('overdue')
      expect(pred.overdueCount).toBe(1)
      expect(pred.goodCount).toBe(1)
      expect(pred.mostUrgentRule?.rule.name).toBe('Brake Fluid')
    })

    it('ignores inactive rules', () => {
      const inactiveRule: VehicleMaintenanceRuleDTO = {
        ...baseRule,
        is_active: false,
      }
      const pred = predictNextMaintenance([inactiveRule], { currentOdometer: 50000 })
      expect(pred.status).toBe('untracked')
    })
  })

  describe('updateVehicleServiceSchema', () => {
    it('successfully parses valid update payload', () => {
      const parsed = updateVehicleServiceSchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        vehicleId: '123e4567-e89b-12d3-a456-426614174001',
        cost: 650000,
        workshopName: 'Honda Speed Shop',
        invoiceNumber: 'INV-2026-999',
        externalInvoiceUrl: 'https://drive.google.com/file/d/abc/view',
        notes: 'Swapped engine oil and torqued drain plug',
      })

      expect(parsed.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(parsed.vehicleId).toBe('123e4567-e89b-12d3-a456-426614174001')
      expect(parsed.cost).toBe(650000)
      expect(parsed.workshopName).toBe('Honda Speed Shop')
      expect(parsed.invoiceNumber).toBe('INV-2026-999')
      expect(parsed.externalInvoiceUrl).toBe('https://drive.google.com/file/d/abc/view')
      expect(parsed.notes).toBe('Swapped engine oil and torqued drain plug')
    })

    it('transforms empty strings to null for optional fields', () => {
      const parsed = updateVehicleServiceSchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        vehicleId: '123e4567-e89b-12d3-a456-426614174001',
        workshopName: '   ',
        invoiceNumber: '',
        externalInvoiceUrl: '',
        notes: '',
      })

      expect(parsed.workshopName).toBeNull()
      expect(parsed.invoiceNumber).toBeNull()
      expect(parsed.externalInvoiceUrl).toBeNull()
      expect(parsed.notes).toBeNull()
    })

    it('rejects invalid service ID or vehicle ID', () => {
      expect(() =>
        updateVehicleServiceSchema.parse({
          id: 'invalid-id',
          vehicleId: '123e4567-e89b-12d3-a456-426614174001',
        })
      ).toThrow()

      expect(() =>
        updateVehicleServiceSchema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          vehicleId: 'invalid-veh-id',
        })
      ).toThrow()
    })

    it('rejects negative cost', () => {
      expect(() =>
        updateVehicleServiceSchema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          vehicleId: '123e4567-e89b-12d3-a456-426614174001',
          cost: -50,
        })
      ).toThrow()
    })
  })
})
