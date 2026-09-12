import { describe, it, expect } from 'vitest'
import {
  calculateDocumentExpiry,
  advanceExpiryDate,
  matchCashflowCategory,
} from '@/features/garage/lib/document-math'
import {
  createVehicleDocumentSchema,
  renewVehicleDocumentSchema,
  deleteVehicleDocumentSchema,
  createDriverLicenseSchema,
} from '@/features/garage/schemas.server'
import {
  vehicleDocumentFormClientSchema,
  renewDocumentClientSchema,
  driverLicenseFormClientSchema,
} from '@/features/garage/schemas.client'
import { isVehicleDocumentType, isDriverLicenseCategory } from '@/features/garage/types'

describe('Day 4: Vehicle Documents Math & Expiry Calculation', () => {
  const referenceDate = new Date(Date.UTC(2026, 8, 12)) // 2026-09-12

  describe('calculateDocumentExpiry', () => {
    it('returns "valid" status when expiration is > 30 days away', () => {
      const result = calculateDocumentExpiry('2026-11-15', referenceDate)
      expect(result.status).toBe('valid')
      expect(result.daysRemaining).toBe(64)
      expect(result.formattedDays).toBe('64 days')
    })

    it('returns "expiring_soon" when expiration is between 1 and 30 days', () => {
      const result = calculateDocumentExpiry('2026-09-25', referenceDate)
      expect(result.status).toBe('expiring_soon')
      expect(result.daysRemaining).toBe(13)
      expect(result.formattedDays).toBe('13 days')
    })

    it('returns "expiring_soon" when expiration is today (0 days left)', () => {
      const result = calculateDocumentExpiry('2026-09-12', referenceDate)
      expect(result.status).toBe('expiring_soon')
      expect(result.daysRemaining).toBe(0)
      expect(result.formattedDays).toBe('Today')
    })

    it('returns "expired" when expiration is in the past', () => {
      const result = calculateDocumentExpiry('2026-09-02', referenceDate)
      expect(result.status).toBe('expired')
      expect(result.daysRemaining).toBe(-10)
      expect(result.formattedDays).toBe('10 days ago')
    })

    it('calculates exact 1-day difference without timezone hour drift', () => {
      const res1 = calculateDocumentExpiry('2026-09-13', referenceDate)
      expect(res1.daysRemaining).toBe(1)
      expect(res1.formattedDays).toBe('1 day')

      const resYesterday = calculateDocumentExpiry('2026-09-11', referenceDate)
      expect(resYesterday.daysRemaining).toBe(-1)
      expect(resYesterday.formattedDays).toBe('1 day ago')
    })
  })

  describe('advanceExpiryDate', () => {
    it('advances 1 year accurately (+1y)', () => {
      const next = advanceExpiryDate('2026-09-12', '1y')
      expect(next).toBe('2027-09-12')
    })

    it('advances 5 years accurately (+5y) for STNK / plate renewal', () => {
      const next = advanceExpiryDate('2026-09-12', '5y')
      expect(next).toBe('2031-09-12')
    })

    it('advances 6 months accurately (+6m)', () => {
      const next = advanceExpiryDate('2026-09-12', '6m')
      expect(next).toBe('2027-03-12')
    })

    it('handles leap year transition when advancing (+1y)', () => {
      // 2024-02-29 + 1 year -> 2025-02-28
      const next = advanceExpiryDate('2024-02-29', '1y')
      expect(next).toBe('2025-02-28')
    })

    it('uses custom date when preset is "custom"', () => {
      const next = advanceExpiryDate('2026-09-12', 'custom', '2028-01-01')
      expect(next).toBe('2028-01-01')
    })

    it('falls back to +1y if custom date is missing with custom preset', () => {
      const next = advanceExpiryDate('2026-09-12', 'custom')
      expect(next).toBe('2027-09-12')
    })

    it('advances from today if document is expired and fromTodayIfExpired is true', () => {
      // Past expired document from 2023-05-10 with reference today 2026-09-12
      const next = advanceExpiryDate('2023-05-10', '1y', undefined, true, referenceDate)
      expect(next).toBe('2027-09-12')

      const next5y = advanceExpiryDate('2023-05-10', '5y', undefined, true, referenceDate)
      expect(next5y).toBe('2031-09-12')
    })

    it('still advances from future expiry if fromTodayIfExpired is true but date is in the future', () => {
      const next = advanceExpiryDate('2027-01-15', '1y', undefined, true, referenceDate)
      expect(next).toBe('2028-01-15')
    })

    it('preserves official legal anniversary by default (fromTodayIfExpired: false) even if document is expired', () => {
      // Expired STNK from 2026-09-01 (11 days late). Anniversary MUST remain 2027-09-01.
      const next = advanceExpiryDate('2026-09-01', '1y', undefined, false, referenceDate)
      expect(next).toBe('2027-09-01')

      // Expired 5-year plate from 2026-08-15
      const next5y = advanceExpiryDate('2026-08-15', '5y', undefined, false, referenceDate)
      expect(next5y).toBe('2031-08-15')
    })
  })

  describe('matchCashflowCategory', () => {
    const availableCategories = ['Groceries', 'Transport & Fuel', 'Entertainment', 'Housing']

    it('matches "transport" keyword accurately', () => {
      const match = matchCashflowCategory(availableCategories, 'Annual Road Tax (PKB)')
      expect(match).toBe('Transport & Fuel')
    })

    it('matches "pajak" or "tax" keyword', () => {
      const categories = ['Makan', 'Pajak & Legal', 'Hobi']
      const match = matchCashflowCategory(categories, 'Pajak Tahunan')
      expect(match).toBe('Pajak & Legal')
    })

    it('falls back to null if no category matches', () => {
      const categories = ['Food', 'Health', 'Education']
      const match = matchCashflowCategory(categories, 'STNK')
      expect(match).toBeNull()
    })
  })
})

describe('Day 4: Server Schemas Validation', () => {
  const validVehicleId = '123e4567-e89b-12d3-a456-426614174000'
  const validDocId = '223e4567-e89b-12d3-a456-426614174000'

  describe('createVehicleDocumentSchema', () => {
    it('accepts valid input with all fields', () => {
      const valid = createVehicleDocumentSchema.safeParse({
        vehicleId: validVehicleId,
        documentType: 'road_tax_annual',
        title: 'Pajak Tahunan (PKB)',
        documentNumber: 'STNK-992019',
        expiryDate: '2027-09-12',
        cost: 3500000,
        notes: 'Samsat Jakarta Selatan',
      })
      expect(valid.success).toBe(true)
    })

    it('rejects invalid document_type', () => {
      const invalid = createVehicleDocumentSchema.safeParse({
        vehicleId: validVehicleId,
        documentType: 'invalid_type',
        title: 'Pajak Tahunan',
        expiryDate: '2027-09-12',
      })
      expect(invalid.success).toBe(false)
    })

    it('rejects invalid vehicleId non-uuid', () => {
      const invalid = createVehicleDocumentSchema.safeParse({
        vehicleId: 'non-uuid',
        documentType: 'insurance',
        title: 'Asuransi',
        expiryDate: '2027-09-12',
      })
      expect(invalid.success).toBe(false)
    })

    it('rejects negative cost', () => {
      const invalid = createVehicleDocumentSchema.safeParse({
        vehicleId: validVehicleId,
        documentType: 'insurance',
        title: 'Asuransi',
        expiryDate: '2027-09-12',
        cost: -500,
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe('renewVehicleDocumentSchema', () => {
    it('accepts 1y preset without custom date', () => {
      const res = renewVehicleDocumentSchema.safeParse({
        id: validDocId,
        vehicleId: validVehicleId,
        preset: '1y',
        renewalCost: 1500000,
      })
      expect(res.success).toBe(true)
    })

    it('accepts custom preset with valid customExpiryDate', () => {
      const res = renewVehicleDocumentSchema.safeParse({
        id: validDocId,
        vehicleId: validVehicleId,
        preset: 'custom',
        customExpiryDate: '2028-05-10',
      })
      expect(res.success).toBe(true)
    })

    it('rejects custom preset if customExpiryDate and expiryDate are missing', () => {
      const res = renewVehicleDocumentSchema.safeParse({
        id: validDocId,
        vehicleId: validVehicleId,
        preset: 'custom',
      })
      expect(res.success).toBe(false)
    })

    it('accepts Cashflow sync parameters', () => {
      const res = renewVehicleDocumentSchema.safeParse({
        id: validDocId,
        vehicleId: validVehicleId,
        preset: '1y',
        renewalCost: 2000000,
        recordToCashflow: true,
        cashflowId: validDocId,
        cashflowCategoryId: 'Transportation',
      })
      expect(res.success).toBe(true)
    })

    it('accepts advanceFromToday flag', () => {
      const res = renewVehicleDocumentSchema.safeParse({
        id: validDocId,
        vehicleId: validVehicleId,
        preset: '1y',
        advanceFromToday: true,
      })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.advanceFromToday).toBe(true)
      }
    })
  })

  describe('deleteVehicleDocumentSchema', () => {
    it('validates UUIDs properly and defaults deleteCashflowEntry to false', () => {
      const valid = {
        id: validDocId,
        vehicleId: validVehicleId,
      }
      expect(deleteVehicleDocumentSchema.parse(valid)).toEqual({
        ...valid,
        deleteCashflowEntry: false,
      })

      expect(
        deleteVehicleDocumentSchema.parse({
          ...valid,
          deleteCashflowEntry: true,
        })
      ).toEqual({
        ...valid,
        deleteCashflowEntry: true,
      })

      expect(() =>
        deleteVehicleDocumentSchema.parse({ id: 'bad-id', vehicleId: validVehicleId })
      ).toThrow(/Invalid document ID/)
    })
  })

  describe('createDriverLicenseSchema', () => {
    it('accepts valid driver license input with licenseName', () => {
      const res = createDriverLicenseSchema.safeParse({
        category: 'car',
        licenseName: 'SIM A (Mobil Pribadi)',
        licenseNumber: '941012384910',
        expiryDate: '2029-09-12',
        notes: 'Satpas Daan Mogot',
      })
      expect(res.success).toBe(true)
    })

    it('accepts valid driver license input with title alias', () => {
      const res = createDriverLicenseSchema.safeParse({
        category: 'motorcycle',
        title: 'SIM C (Motor)',
        licenseNumber: '941012384910',
        expiryDate: '2029-09-12',
      })
      expect(res.success).toBe(true)
    })

    it('rejects invalid category', () => {
      const res = createDriverLicenseSchema.safeParse({
        category: 'sim_z',
        title: 'SIM Z',
        expiryDate: '2029-09-12',
      })
      expect(res.success).toBe(false)
    })

    it('rejects missing licenseName and title', () => {
      const res = createDriverLicenseSchema.safeParse({
        category: 'motorcycle',
        expiryDate: '2029-09-12',
      })
      expect(res.success).toBe(false)
    })
  })
})

describe('Day 4: Client Schemas Validation', () => {
  it('validates client form schema for vehicle document', () => {
    const res = vehicleDocumentFormClientSchema.safeParse({
      title: 'Pajak PKB 2026',
      document_type: 'road_tax_annual',
      expiry_date: '2027-09-12',
      cost: '3500000',
    })
    expect(res.success).toBe(true)
  })

  it('validates client form schema for renewal', () => {
    const res = renewDocumentClientSchema.safeParse({
      preset: '5y',
      renewal_cost: '4500000',
      record_to_cashflow: true,
    })
    expect(res.success).toBe(true)
  })

  it('validates client form schema for driver license', () => {
    const res = driverLicenseFormClientSchema.safeParse({
      title: 'SIM C (Motor)',
      category: 'motorcycle',
      license_number: '1234567890',
      expiry_date: '2030-01-15',
    })
    expect(res.success).toBe(true)
  })
})

describe('Day 4: Type Guards', () => {
  it('validates isVehicleDocumentType', () => {
    expect(isVehicleDocumentType('road_tax_annual')).toBe(true)
    expect(isVehicleDocumentType('registration_renewal')).toBe(true)
    expect(isVehicleDocumentType('insurance')).toBe(true)
    expect(isVehicleDocumentType('inspection')).toBe(true)
    expect(isVehicleDocumentType('other')).toBe(true)
    expect(isVehicleDocumentType('passport')).toBe(false)
    expect(isVehicleDocumentType(null)).toBe(false)
  })

  it('validates isDriverLicenseCategory', () => {
    expect(isDriverLicenseCategory('car')).toBe(true)
    expect(isDriverLicenseCategory('motorcycle')).toBe(true)
    expect(isDriverLicenseCategory('commercial')).toBe(true)
    expect(isDriverLicenseCategory('other')).toBe(true)
    expect(isDriverLicenseCategory('sim_xyz')).toBe(false)
    expect(isDriverLicenseCategory(undefined)).toBe(false)
  })
})

describe('Day 4: Regulatory Alert Cooldown & Status Derivation', () => {
  it('correctly derives expired status when driver license expiry is in past', () => {
    const expiredLicense = {
      id: 'lic-1',
      user_id: 'u-1',
      license_name: 'SIM A (Mobil Pribadi)',
      category: 'car' as const,
      license_number: '12345678',
      expiry_date: '2026-08-01',
      notes: null,
      created_at: new Date().toISOString(),
    }
    const expiry = calculateDocumentExpiry(expiredLicense.expiry_date, new Date('2026-09-12T00:00:00Z'))
    expect(expiry.status).toBe('expired')
    expect(expiry.daysRemaining).toBeLessThan(0)
  })

  it('correctly derives expiring_soon status when license expiry is within 30 days', () => {
    const expiringLicense = {
      id: 'lic-2',
      user_id: 'u-1',
      license_name: 'SIM C (Motor)',
      category: 'motorcycle' as const,
      license_number: '87654321',
      expiry_date: '2026-09-25',
      notes: null,
      created_at: new Date().toISOString(),
    }
    const expiry = calculateDocumentExpiry(expiringLicense.expiry_date, new Date('2026-09-12T00:00:00Z'))
    expect(expiry.status).toBe('expiring_soon')
    expect(expiry.daysRemaining).toBe(13)
  })

  it('correctly derives valid status when license expiry is > 30 days away', () => {
    const validLicense = {
      id: 'lic-3',
      user_id: 'u-1',
      license_name: 'SIM A (Mobil)',
      category: 'car' as const,
      license_number: '99999999',
      expiry_date: '2027-09-12',
      notes: null,
      created_at: new Date().toISOString(),
    }
    const expiry = calculateDocumentExpiry(validLicense.expiry_date, new Date('2026-09-12T00:00:00Z'))
    expect(expiry.status).toBe('valid')
    expect(expiry.daysRemaining).toBe(365)
  })
})
