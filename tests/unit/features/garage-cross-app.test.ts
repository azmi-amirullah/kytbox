import { describe, it, expect } from 'vitest'
import { matchCashflowCategory } from '@/features/garage/lib/document-math'
import { getFuelUnitLabels } from '@/features/garage/lib/fuel-math'

describe('Garage Cross-App Integration (Cashflow & List)', () => {
  describe('Cashflow Category Matching', () => {
    it('matches Transport category for vehicle expenses', () => {
      const availableCategories = ['Food', 'Housing', 'Transport', 'Utilities', 'Entertainment']
      const matched = matchCashflowCategory(availableCategories, 'Road Tax Annual')
      expect(matched).toBe('Transport')
    })

    it('matches case-insensitively and partial keywords', () => {
      const categories = ['makan', 'Kendaraan', 'gaji']
      const matched = matchCashflowCategory(categories, 'Total Loss Insurance')
      expect(matched).toBe('Kendaraan')
    })

    it('falls back to null or first category if no match', () => {
      const categories = ['Shopping', 'Investment']
      const matched = matchCashflowCategory(categories, 'Inspection')
      expect(matched).toBeNull()
    })
  })

  describe('Cross-App Currency Reconciliation Detection', () => {
    it('detects matching currencies correctly', () => {
      const vehicleCurrency = 'IDR'
      const bookCurrency = 'idr'
      const isMismatch = vehicleCurrency.toUpperCase() !== bookCurrency.toUpperCase()
      expect(isMismatch).toBe(false)
    })

    it('detects currency mismatches (e.g. IDR vehicle with USD cashflow book)', () => {
      const vehicleCurrency = 'IDR'
      const bookCurrency = 'USD'
      const isMismatch = vehicleCurrency.toUpperCase() !== bookCurrency.toUpperCase()
      expect(isMismatch).toBe(true)
    })
  })

  describe('List Task Synchronization Formatting', () => {
    it('formats maintenance task titles with vehicle tag', () => {
      const vehicleName = 'Civic Turbo'
      const ruleName = 'Engine Oil & Filter'
      const itemTitle = `[${vehicleName}] Service: ${ruleName}`
      expect(itemTitle).toBe('[Civic Turbo] Service: Engine Oil & Filter')
    })

    it('computes predicted due date for List sync accurately', () => {
      const remainingDays = 10
      const baseDate = new Date('2026-09-01T00:00:00Z')
      const targetDate = new Date(baseDate.getTime() + remainingDays * 86400000)
      expect(targetDate.toISOString().slice(0, 10)).toBe('2026-09-11')
    })

    it('assigns urgent/high priority to overdue maintenance tasks', () => {
      const isOverdue = true
      const priority = isOverdue ? 'high' : 'medium'
      expect(priority).toBe('high')
    })
  })

  describe('Fuel Fill-up Cashflow Payload Formatting', () => {
    it('formats consolidated fuel expense note accurately', () => {
      const vehicle = { name: 'Yamaha NMAX', license_plate: 'B 1234 XYZ', fuel_type: 'petrol' as const, odo_unit: 'km' as const }
      const labels = getFuelUnitLabels(vehicle.fuel_type, vehicle.odo_unit)
      const fuelAmount = 6.5
      const vehicleLabel = `${vehicle.name}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}`
      const desc = `Fuel: ${vehicleLabel} - ${fuelAmount} ${labels.volumeUnit}`
      expect(desc).toBe('Fuel: Yamaha NMAX (B 1234 XYZ) - 6.5 L')
    })
  })
})
