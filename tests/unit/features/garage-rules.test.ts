import { describe, it, expect } from 'vitest'
import { getDefaultRulesForVehicle } from '@/features/garage/lib/presets'
import {
  calculateRuleDueStatus,
  sortRulesByUrgency,
  type RuleWithStatusItem,
} from '@/features/garage/lib/rules-math'
import type { MaintenanceCategory, RuleStatus } from '@/features/garage/types'
import {
  createMaintenanceRuleSchema,
  updateMaintenanceRuleSchema,
  applyDefaultPresetsSchema,
} from '@/features/garage/schemas.server'
import { maintenanceRuleFormClientSchema } from '@/features/garage/schemas.client'

describe('Garage Maintenance Rules & Interval Engine', () => {
  describe('getDefaultRulesForVehicle Presets', () => {
    it('generates petrol car presets with spark plugs and engine oil', () => {
      const presets = getDefaultRulesForVehicle('car', 'petrol', 'km')
      const names = presets.map((p) => p.name)

      expect(names).toContain('Engine Oil & Filter')
      expect(names).toContain('Spark Plugs')
      expect(names).toContain('Cabin A/C Filter')
      expect(names).toContain('Tire Rotation & Balance')
      expect(names).toContain('Periodic Service')
      expect(names).not.toContain('Diesel Fuel Filter (Sedimenter)')
      expect(names).not.toContain('Reduction Gearbox Oil')

      const oilRule = presets.find((p) => p.name === 'Engine Oil & Filter')
      expect(oilRule?.intervalDistance).toBe(5000)
      expect(oilRule?.intervalMonths).toBe(6)
    })

    it('generates diesel car presets with Diesel Fuel Filter and NO Spark Plugs', () => {
      const presets = getDefaultRulesForVehicle('car', 'diesel', 'km')
      const names = presets.map((p) => p.name)

      expect(names).toContain('Engine Oil & Filter')
      expect(names).toContain('Diesel Fuel Filter (Sedimenter)')
      expect(names).not.toContain('Spark Plugs')

      const fuelFilter = presets.find((p) => p.name === 'Diesel Fuel Filter (Sedimenter)')
      expect(fuelFilter?.intervalDistance).toBe(20000)
      expect(fuelFilter?.intervalMonths).toBe(12)
    })

    it('generates electric car (EV) presets with NO engine oil or spark plugs', () => {
      const presets = getDefaultRulesForVehicle('car', 'electric', 'km')
      const names = presets.map((p) => p.name)

      expect(names).not.toContain('Engine Oil & Filter')
      expect(names).not.toContain('Spark Plugs')
      expect(names).toContain('Reduction Gearbox Oil')
      expect(names).toContain('Tire Rotation & Balance')
      expect(names).toContain('Cabin A/C Filter')

      const tireRule = presets.find((p) => p.name === 'Tire Rotation & Balance')
      expect(tireRule?.intervalDistance).toBe(10000)
      expect(tireRule?.intervalMonths).toBe(6)
    })

    it('generates hybrid car presets with Inverter Coolant', () => {
      const presets = getDefaultRulesForVehicle('car', 'hybrid', 'km')
      const names = presets.map((p) => p.name)

      expect(names).toContain('Engine Oil & Filter')
      expect(names).toContain('Inverter Coolant')
    })

    it('generates automatic motorcycle (scooter) presets with CVT Belt and Transmission Gear Oil, NO Drive Chain', () => {
      const presets = getDefaultRulesForVehicle('motorcycle', 'petrol', 'km', 'automatic')
      const names = presets.map((p) => p.name)

      expect(names).toContain('Engine Oil')
      expect(names).toContain('Transmission / Gear Oil')
      expect(names).toContain('Spark Plug')
      expect(names).toContain('Engine Air Filter')
      expect(names).toContain('Front Brake Pads (Disc)')
      expect(names).toContain('Rear Brake Pads / Shoes (Disc / Drum)')
      expect(names).toContain('Brake Fluid')
      expect(names).toContain('Radiator Fluid / Coolant')
      expect(names).toContain('CVT Belt & Rollers')
      expect(names).toContain('Front & Rear Tires (Wear & Replacement)')
      expect(names).toContain('Periodic Service')
      expect(names).not.toContain('Drive Chain Lube & Clean')

      const oilRule = presets.find((p) => p.name === 'Engine Oil')
      expect(oilRule?.intervalDistance).toBe(3000)
      expect(oilRule?.intervalMonths).toBe(3)

      const frontBrakeRule = presets.find((p) => p.name === 'Front Brake Pads (Disc)')
      expect(frontBrakeRule?.category).toBe('brakes')
      expect(frontBrakeRule?.intervalDistance).toBe(10000)
      expect(frontBrakeRule?.intervalMonths).toBe(12)

      const rearBrakeRule = presets.find((p) => p.name === 'Rear Brake Pads / Shoes (Disc / Drum)')
      expect(rearBrakeRule?.category).toBe('brakes')
      expect(rearBrakeRule?.intervalDistance).toBe(24000)
      expect(rearBrakeRule?.intervalMonths).toBe(24)

      const cvtRule = presets.find((p) => p.name === 'CVT Belt & Rollers')
      expect(cvtRule?.category).toBe('powertrain')
      expect(cvtRule?.intervalDistance).toBe(24000)
      expect(cvtRule?.intervalMonths).toBe(24)
    })

    it('generates manual motorcycle presets with Drive Chain, NO CVT Belt or separate Gearbox Oil', () => {
      const presets = getDefaultRulesForVehicle('motorcycle', 'petrol', 'km', 'manual')
      const names = presets.map((p) => p.name)

      expect(names).toContain('Engine Oil')
      expect(names).toContain('Drive Chain Lube & Clean')
      expect(names).toContain('Spark Plug')
      expect(names).not.toContain('CVT Belt & Rollers')
      expect(names).not.toContain('Transmission / Gear Oil')

      const chainRule = presets.find((p) => p.name === 'Drive Chain Lube & Clean')
      expect(chainRule?.category).toBe('powertrain')
      expect(chainRule?.intervalDistance).toBe(1000)
      expect(chainRule?.intervalMonths).toBe(1)
    })

    it('generates automatic vs manual transmission fluid rules for cars', () => {
      const autoCar = getDefaultRulesForVehicle('car', 'petrol', 'km', 'automatic')
      const autoNames = autoCar.map((p) => p.name)
      expect(autoNames).toContain('Automatic Transmission Fluid (ATF / CVT)')
      expect(autoNames).not.toContain('Manual Transmission Fluid (MTF)')
      const atfRule = autoCar.find((p) => p.name === 'Automatic Transmission Fluid (ATF / CVT)')
      expect(atfRule?.intervalMonths).toBe(24)

      const manualCar = getDefaultRulesForVehicle('car', 'petrol', 'km', 'manual')
      const manualNames = manualCar.map((p) => p.name)
      expect(manualNames).toContain('Manual Transmission Fluid (MTF)')
      expect(manualNames).not.toContain('Automatic Transmission Fluid (ATF / CVT)')
      const mtfRule = manualCar.find((p) => p.name === 'Manual Transmission Fluid (MTF)')
      expect(mtfRule?.intervalMonths).toBe(36)
    })

    it('generates bicycle presets with chain clean, sealant, and brake wear', () => {
      const presets = getDefaultRulesForVehicle('bicycle', 'petrol', 'km')
      const names = presets.map((p) => p.name)

      expect(names).toContain('Chain Clean & Lubrication')
      expect(names).toContain('Tire Sealant Top-Up')
      expect(names).toContain('Brake Pads & Cable / Hydraulic Bleed')
      expect(names).toContain('Chain Stretch & Wear Check')
    })

    it('scales presets to clean human shop numbers when miles unit is selected', () => {
      const presets = getDefaultRulesForVehicle('car', 'petrol', 'miles')
      const oilRule = presets.find((p) => p.name === 'Engine Oil & Filter')
      const sparkRule = presets.find((p) => p.name === 'Spark Plugs')
      const tireRule = presets.find((p) => p.name === 'Tire Rotation & Balance')

      expect(oilRule?.intervalDistance).toBe(3000)
      expect(sparkRule?.intervalDistance).toBe(25000)
      expect(tireRule?.intervalDistance).toBe(6000)
    })
  })

  describe('calculateRuleDueStatus Math Engine', () => {
    const fixedNow = new Date('2026-09-05T00:00:00Z')

    it('returns untracked for inactive rule', () => {
      const status = calculateRuleDueStatus(
        {
          interval_distance: 5000,
          interval_months: 6,
          last_service_odometer: 40000,
          last_service_date: '2026-08-01',
          is_active: false,
        },
        { currentOdometer: 42000, unit: 'km', nowDate: fixedNow }
      )

      expect(status.status).toBe('untracked')
      expect(status.isOverdue).toBe(false)
      expect(status.isDueSoon).toBe(false)
    })

    it('returns untracked when no baseline odometer or date is set', () => {
      const status = calculateRuleDueStatus(
        {
          interval_distance: 5000,
          interval_months: 6,
          last_service_odometer: null,
          last_service_date: null,
          is_active: true,
        },
        { currentOdometer: 42000, unit: 'km', nowDate: fixedNow }
      )

      expect(status.status).toBe('untracked')
      expect(status.remainingDistance).toBeNull()
      expect(status.remainingDays).toBeNull()
    })

    it('computes status good when comfortably within distance and time thresholds', () => {
      const status = calculateRuleDueStatus(
        {
          interval_distance: 5000,
          interval_months: 6,
          last_service_odometer: 40000,
          last_service_date: '2026-08-01',
          is_active: true,
        },
        { currentOdometer: 41000, unit: 'km', nowDate: fixedNow }
      )

      expect(status.status).toBe('good')
      expect(status.remainingDistance).toBe(4000)
      expect(status.isOverdue).toBe(false)
      expect(status.isDueSoon).toBe(false)
      expect(status.percentRemaining).toBeGreaterThan(70)
    })

    it('computes due_soon when remaining distance is <= 500 km', () => {
      const status = calculateRuleDueStatus(
        {
          interval_distance: 5000,
          interval_months: 6,
          last_service_odometer: 40000,
          last_service_date: '2026-08-01',
          is_active: true,
        },
        { currentOdometer: 44650, unit: 'km', nowDate: fixedNow }
      )

      expect(status.status).toBe('due_soon')
      expect(status.remainingDistance).toBe(350)
      expect(status.isDueSoon).toBe(true)
      expect(status.isOverdue).toBe(false)
      expect(status.primaryTrigger).toBe('distance')
    })

    it('computes overdue when remaining distance <= 0', () => {
      const status = calculateRuleDueStatus(
        {
          interval_distance: 5000,
          interval_months: 6,
          last_service_odometer: 40000,
          last_service_date: '2026-08-01',
          is_active: true,
        },
        { currentOdometer: 45200, unit: 'km', nowDate: fixedNow }
      )

      expect(status.status).toBe('overdue')
      expect(status.remainingDistance).toBe(-200)
      expect(status.isOverdue).toBe(true)
      expect(status.primaryTrigger).toBe('distance')
    })

    it('triggers overdue when elapsed time exceeds interval months even if mileage is low (weekend car)', () => {
      // Last service was 7 months ago (2026-02-01), but only 100 km driven
      const status = calculateRuleDueStatus(
        {
          interval_distance: 5000,
          interval_months: 6,
          last_service_odometer: 40000,
          last_service_date: '2026-02-01',
          is_active: true,
        },
        { currentOdometer: 40100, unit: 'km', nowDate: fixedNow }
      )

      expect(status.status).toBe('overdue')
      expect(status.remainingDistance).toBe(4900)
      expect(status.remainingDays).toBeLessThan(0)
      expect(status.isOverdue).toBe(true)
      expect(status.primaryTrigger).toBe('time')
    })
  })

  describe('Validation Schemas', () => {
    it('parses valid createMaintenanceRule payload', () => {
      const valid = {
        vehicleId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Ferrox Air Filter',
        category: 'filters',
        intervalDistance: '15000',
        intervalMonths: '12',
        lastServiceOdometer: '42000',
        lastServiceDate: '2026-06-15',
        isActive: 'true',
      }

      const parsed = createMaintenanceRuleSchema.parse(valid)
      expect(parsed.name).toBe('Ferrox Air Filter')
      expect(parsed.category).toBe('filters')
      expect(parsed.intervalDistance).toBe(15000)
      expect(parsed.intervalMonths).toBe(12)
      expect(parsed.lastServiceOdometer).toBe(42000)
      expect(parsed.isActive).toBe(true)
    })

    it('rejects rule when neither distance nor month interval is provided', () => {
      expect(() =>
        createMaintenanceRuleSchema.parse({
          vehicleId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Invalid Rule',
          category: 'other',
        })
      ).toThrow('At least one interval (distance or months) must be specified')
    })

    it('rejects empty rule name', () => {
      expect(() =>
        createMaintenanceRuleSchema.parse({
          vehicleId: '123e4567-e89b-12d3-a456-426614174000',
          name: '   ',
          category: 'fluids',
          intervalDistance: 5000,
        })
      ).toThrow('Rule name is required')
    })

    it('parses applyDefaultPresetsSchema with valid options', () => {
      const valid = {
        vehicleId: '123e4567-e89b-12d3-a456-426614174000',
        baselineMode: 'current_odometer',
        selectedRuleNames: ['Engine Oil & Filter', 'Brake Fluid'],
      }

      const parsed = applyDefaultPresetsSchema.parse(valid)
      expect(parsed.baselineMode).toBe('current_odometer')
      expect(parsed.selectedRuleNames).toHaveLength(2)
    })

    it('parses valid updateMaintenanceRule payload', () => {
      const valid = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Synthetic Engine Oil',
        category: 'fluids',
        intervalDistance: 10000,
        intervalMonths: 12,
        isActive: false,
      }

      const parsed = updateMaintenanceRuleSchema.parse(valid)
      expect(parsed.name).toBe('Synthetic Engine Oil')
      expect(parsed.intervalDistance).toBe(10000)
      expect(parsed.isActive).toBe(false)
    })

    it('parses client schema with fallback defaults', () => {
      const clientValid = {
        name: 'Brake Pads',
        category: 'brakes',
        intervalDistance: 25000,
        intervalMonths: 18,
        isActive: true,
      }

      const parsed = maintenanceRuleFormClientSchema.parse(clientValid)
      expect(parsed.name).toBe('Brake Pads')
      expect(parsed.category).toBe('brakes')
    })
  })

  describe('sortRulesByUrgency Sorting Engine', () => {
    function createTestRuleItem(params: {
      id: string
      name: string
      category?: MaintenanceCategory
      isActive?: boolean
      percentRemaining?: number | null
      remainingDistance?: number | null
      remainingDays?: number | null
      isOverdue?: boolean
      isDueSoon?: boolean
      primaryTrigger?: 'distance' | 'time' | 'both' | 'none'
      status?: RuleStatus
    }): RuleWithStatusItem {
      const isOverdue = params.isOverdue ?? false
      const isDueSoon = params.isDueSoon ?? false
      const status: RuleStatus =
        params.status ??
        (params.isActive === false
          ? 'untracked'
          : isOverdue
          ? 'overdue'
          : isDueSoon
          ? 'due_soon'
          : params.percentRemaining === null
          ? 'untracked'
          : 'good')

      return {
        rule: {
          id: params.id,
          vehicle_id: 'test-vehicle-id',
          name: params.name,
          category: params.category ?? 'fluids',
          interval_distance: 5000,
          interval_months: 6,
          last_service_odometer: null,
          last_service_date: null,
          is_active: params.isActive ?? true,
          created_at: null,
        },
        status: {
          status,
          percentRemaining: params.percentRemaining ?? null,
          remainingDistance: params.remainingDistance ?? null,
          remainingDays: params.remainingDays ?? null,
          isOverdue,
          isDueSoon,
          primaryTrigger: params.primaryTrigger ?? 'none',
        },
      }
    }

    it('sorts rules with lower percentage remaining first', () => {
      const items: RuleWithStatusItem[] = [
        createTestRuleItem({
          id: '1',
          name: 'Brake Pads',
          category: 'brakes',
          percentRemaining: 100,
          remainingDistance: 10000,
          remainingDays: 365,
        }),
        createTestRuleItem({
          id: '2',
          name: 'Engine Oil',
          category: 'fluids',
          percentRemaining: 25,
          remainingDistance: 1250,
          remainingDays: 45,
        }),
        createTestRuleItem({
          id: '3',
          name: 'Tire Check',
          category: 'tires',
          percentRemaining: 60,
          remainingDistance: 6000,
          remainingDays: 180,
        }),
      ]

      const sorted = sortRulesByUrgency(items)
      expect(sorted.map((i) => i.rule.name)).toEqual([
        'Engine Oil', // 25%
        'Tire Check', // 60%
        'Brake Pads', // 100%
      ])
    })

    it('tie-breaks equal percentages by lower remaining distance first', () => {
      const items: RuleWithStatusItem[] = [
        createTestRuleItem({
          id: '1',
          name: 'Brake Pads & Shoes',
          category: 'brakes',
          percentRemaining: 100,
          remainingDistance: 10000,
          remainingDays: 365,
        }),
        createTestRuleItem({
          id: '2',
          name: 'Spark Plug',
          category: 'electrical',
          percentRemaining: 100,
          remainingDistance: 8000,
          remainingDays: 365,
        }),
        createTestRuleItem({
          id: '3',
          name: 'Brake Fluid',
          category: 'fluids',
          percentRemaining: 100,
          remainingDistance: 20000,
          remainingDays: 730,
        }),
      ]

      const sorted = sortRulesByUrgency(items)
      expect(sorted.map((i) => i.rule.name)).toEqual([
        'Spark Plug', // 8,000 km left
        'Brake Pads & Shoes', // 10,000 km left
        'Brake Fluid', // 20,000 km left
      ])
    })

    it('places more overdue rules ahead of less overdue rules', () => {
      const items: RuleWithStatusItem[] = [
        createTestRuleItem({
          id: '1',
          name: 'Minor Overdue',
          percentRemaining: 0,
          remainingDistance: -200,
          isOverdue: true,
        }),
        createTestRuleItem({
          id: '2',
          name: 'Major Overdue',
          percentRemaining: 0,
          remainingDistance: -3000,
          isOverdue: true,
        }),
      ]

      const sorted = sortRulesByUrgency(items)
      expect(sorted[0].rule.name).toBe('Major Overdue')
      expect(sorted[1].rule.name).toBe('Minor Overdue')
    })

    it('places inactive and untracked items at the bottom', () => {
      const items: RuleWithStatusItem[] = [
        createTestRuleItem({
          id: '1',
          name: 'Inactive Rule',
          isActive: false,
          percentRemaining: 0,
        }),
        createTestRuleItem({
          id: '2',
          name: 'Active Good',
          category: 'brakes',
          percentRemaining: 100,
          remainingDistance: 5000,
        }),
        createTestRuleItem({
          id: '3',
          name: 'Untracked Active',
          category: 'other',
          percentRemaining: null,
        }),
      ]

      const sorted = sortRulesByUrgency(items)
      expect(sorted.map((i) => i.rule.name)).toEqual([
        'Active Good',
        'Untracked Active',
        'Inactive Rule',
      ])
    })
  })
})
