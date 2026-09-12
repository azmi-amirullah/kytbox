import { describe, it, expect } from 'vitest'
import {
  getFuelUnitLabels,
  calculateFuelAmountFromTotal,
  calculateTotalCostFromAmount,
  computeNewLogEconomy,
  recalculateFuelEconomySequence,
  calculateFuelStats,
} from '@/features/garage/lib/fuel-math'
import type { VehicleFuelLogDTO } from '@/types/dto'

describe('Garage Fuel Math Engine', () => {
  describe('getFuelUnitLabels', () => {
    it('returns correct units for petrol/diesel with km', () => {
      const labels = getFuelUnitLabels('petrol', 'km')
      expect(labels.volumeUnit).toBe('L')
      expect(labels.volumeUnitFull).toBe('Liters')
      expect(labels.efficiencyUnit).toBe('km/L')
      expect(labels.priceUnitLabel).toBe('Price / Liter')
    })

    it('returns correct units for petrol/diesel with miles', () => {
      const labels = getFuelUnitLabels('diesel', 'miles')
      expect(labels.volumeUnit).toBe('gal')
      expect(labels.volumeUnitFull).toBe('Gallons')
      expect(labels.efficiencyUnit).toBe('MPG')
      expect(labels.priceUnitLabel).toBe('Price / Gallon')
    })

    it('returns correct units for electric with km', () => {
      const labels = getFuelUnitLabels('electric', 'km')
      expect(labels.volumeUnit).toBe('kWh')
      expect(labels.volumeUnitFull).toBe('kWh')
      expect(labels.efficiencyUnit).toBe('km/kWh')
      expect(labels.priceUnitLabel).toBe('Price / kWh')
    })

    it('returns correct units for electric with miles', () => {
      const labels = getFuelUnitLabels('electric', 'miles')
      expect(labels.volumeUnit).toBe('kWh')
      expect(labels.volumeUnitFull).toBe('kWh')
      expect(labels.efficiencyUnit).toBe('mi/kWh')
      expect(labels.priceUnitLabel).toBe('Price / kWh')
    })
  })

  describe('Pump Auto-Calculators', () => {
    it('calculates fuel volume from total cost and price per unit', () => {
      // Rp 150.000 @ Rp 13.700/L = 10.95 L
      const liters = calculateFuelAmountFromTotal(150000, 13700)
      expect(liters).toBe(10.95)

      // USD $50.00 @ $3.50/gal = 14.29 gal
      const gallons = calculateFuelAmountFromTotal(50, 3.5)
      expect(gallons).toBe(14.29)
    })

    it('returns null on zero or invalid price per unit', () => {
      expect(calculateFuelAmountFromTotal(100000, 0)).toBeNull()
      expect(calculateFuelAmountFromTotal(100000, -500)).toBeNull()
      expect(calculateFuelAmountFromTotal(-1000, 13000)).toBeNull()
    })

    it('calculates total cost from fuel amount and price per unit', () => {
      // 10.95 L @ Rp 13.700/L = Rp 150015
      const cost = calculateTotalCostFromAmount(10.95, 13700)
      expect(cost).toBe(150015)
    })

    it('returns null on invalid amount or price', () => {
      expect(calculateTotalCostFromAmount(0, 1000)).toBeNull()
      expect(calculateTotalCostFromAmount(10, 0)).toBeNull()
      expect(calculateTotalCostFromAmount(-5, 1000)).toBeNull()
    })
  })

  describe('computeNewLogEconomy', () => {
    it('returns null for the first fuel log (baseline)', () => {
      const newLog = {
        odometer: 10000,
        fuel_amount: 35,
        is_full_tank: true,
        is_missed_previous: false,
      }
      expect(computeNewLogEconomy(newLog, [])).toBeNull()
    })

    it('returns null if partial fill-up', () => {
      const existing: VehicleFuelLogDTO[] = [
        {
          id: '1',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-01',
          odometer: 10000,
          fuel_amount: 35,
          price_per_unit: 13000,
          total_cost: 455000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-01T00:00:00Z',
        },
      ]

      const partialLog = {
        odometer: 10200,
        fuel_amount: 10,
        is_full_tank: false,
        is_missed_previous: false,
      }
      expect(computeNewLogEconomy(partialLog, existing)).toBeNull()
    })

    it('calculates km/L accurately for consecutive full tanks', () => {
      const existing: VehicleFuelLogDTO[] = [
        {
          id: '1',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-01',
          odometer: 10000,
          fuel_amount: 35,
          price_per_unit: 13000,
          total_cost: 455000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-01T00:00:00Z',
        },
      ]

      // Traveled 450 km (10450 - 10000) using 30 liters = 15.00 km/L
      const newLog = {
        odometer: 10450,
        fuel_amount: 30,
        is_full_tank: true,
        is_missed_previous: false,
      }
      expect(computeNewLogEconomy(newLog, existing)).toBe(15.0)
    })

    it('accumulates intermediate partial fill-ups correctly upon full tank', () => {
      const existing: VehicleFuelLogDTO[] = [
        {
          id: '1',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-01',
          odometer: 10000,
          fuel_amount: 40,
          price_per_unit: 13000,
          total_cost: 520000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-03',
          odometer: 10250,
          fuel_amount: 10,
          price_per_unit: 13000,
          total_cost: 130000,
          is_full_tank: false, // partial
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-03T00:00:00Z',
        },
      ]

      // Traveled 500 km total (10500 - 10000) with 10 L (partial) + 25 L (now full) = 35 L
      // 500 / 35 = 14.29 km/L
      const fullLog = {
        odometer: 10500,
        fuel_amount: 25,
        is_full_tank: true,
        is_missed_previous: false,
      }
      expect(computeNewLogEconomy(fullLog, existing)).toBe(14.29)
    })

    it('resets baseline when is_missed_previous is true', () => {
      const existing: VehicleFuelLogDTO[] = [
        {
          id: '1',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-01',
          odometer: 10000,
          fuel_amount: 40,
          price_per_unit: 13000,
          total_cost: 520000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-01T00:00:00Z',
        },
      ]

      const missedLog = {
        odometer: 11200,
        fuel_amount: 35,
        is_full_tank: true,
        is_missed_previous: true,
      }
      expect(computeNewLogEconomy(missedLog, existing)).toBeNull()
    })
  })

  describe('recalculateFuelEconomySequence', () => {
    it('processes sequence of full and partial fill-ups deterministically', () => {
      const rawLogs: VehicleFuelLogDTO[] = [
        {
          id: '1',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-01',
          odometer: 50000,
          fuel_amount: 40,
          price_per_unit: 13500,
          total_cost: 540000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-01T08:00:00Z',
        },
        {
          id: '2',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-04',
          odometer: 50400,
          fuel_amount: 30,
          price_per_unit: 13500,
          total_cost: 405000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-04T08:00:00Z',
        },
        {
          id: '3',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-06',
          odometer: 50600,
          fuel_amount: 12,
          price_per_unit: 13500,
          total_cost: 162000,
          is_full_tank: false, // partial
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-06T08:00:00Z',
        },
        {
          id: '4',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-08',
          odometer: 50850,
          fuel_amount: 20,
          price_per_unit: 13500,
          total_cost: 270000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-08T08:00:00Z',
        },
      ]

      const result = recalculateFuelEconomySequence(rawLogs)
      expect(result[0].calculated_kml).toBeNull() // baseline
      // Log 2: 400 km / 30 L = 13.33 km/L
      expect(result[1].calculated_kml).toBe(13.33)
      // Log 3: partial -> null
      expect(result[2].calculated_kml).toBeNull()
      // Log 4: 450 km (50850 - 50400) / (12 + 20 = 32 L) = 14.06 km/L
      expect(result[3].calculated_kml).toBe(14.06)
    })
  })

  describe('calculateFuelStats', () => {
    it('handles empty fuel logs cleanly without NaN', () => {
      const stats = calculateFuelStats([])
      expect(stats.totalLogs).toBe(0)
      expect(stats.totalCost).toBe(0)
      expect(stats.totalVolume).toBe(0)
      expect(stats.totalTrackedDistance).toBe(0)
      expect(stats.averageEconomy).toBeNull()
      expect(stats.lastEconomy).toBeNull()
      expect(stats.costPerDistanceUnit).toBeNull()
    })

    it('aggregates total cost, distance, and averages accurately', () => {
      const logs: VehicleFuelLogDTO[] = [
        {
          id: '1',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-01',
          odometer: 10000,
          fuel_amount: 40,
          price_per_unit: 10000,
          total_cost: 400000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-05',
          odometer: 10500,
          fuel_amount: 35,
          price_per_unit: 10000,
          total_cost: 350000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: 14.29,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-05T00:00:00Z',
        },
      ]

      const stats = calculateFuelStats(logs)
      expect(stats.totalLogs).toBe(2)
      expect(stats.totalCost).toBe(750000)
      expect(stats.totalVolume).toBe(75)
      expect(stats.totalTrackedDistance).toBe(500)
      expect(stats.averageEconomy).toBe(14.29)
      expect(stats.lastEconomy).toBe(14.29)
      // 750,000 / 500 km = 1,500 Rp / km
      expect(stats.costPerDistanceUnit).toBe(1500)
      expect(stats.fullTankCount).toBe(2)
      expect(stats.partialCount).toBe(0)
    })

    it('recalculates sequence correctly when an intermediate log is edited', () => {
      const logs: VehicleFuelLogDTO[] = [
        {
          id: '1',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-01',
          odometer: 10000,
          fuel_amount: 40,
          price_per_unit: 10000,
          total_cost: 400000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: null,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: 'u1',
          vehicle_id: 'v1',
          log_date: '2026-09-05',
          odometer: 10500,
          fuel_amount: 25,
          price_per_unit: 10000,
          total_cost: 250000,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: 20.0,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-05T00:00:00Z',
        },
      ]

      // User edited log #2 to fix typo: odometer 10500 -> 10600 (600 km / 25 L = 24.0 km/L)
      const editedLogs = [
        logs[0],
        { ...logs[1], odometer: 10600 },
      ]

      const recalculated = recalculateFuelEconomySequence(editedLogs)
      expect(recalculated[0].calculated_kml).toBeNull() // baseline remains null
      expect(recalculated[1].calculated_kml).toBe(24.0) // updated to 24.0 km/L
    })
  })
})
