import { describe, it, expect } from 'vitest'
import {
  calculateMonthlyVelocity,
  convertOdometerUnit,
  isOdometerTypoJump,
  formatOdometer,
  predictCurrentOdometer,
} from '@/features/garage/lib/odometer'

describe('Garage Odometer Math & Helpers', () => {
  describe('calculateMonthlyVelocity', () => {
    it('returns cold-start fallback when fewer than 2 monthly records exist', () => {
      const emptyResult = calculateMonthlyVelocity([], 1200)
      expect(emptyResult.isColdStart).toBe(true)
      expect(emptyResult.monthlyVelocity).toBe(1200)
      expect(emptyResult.dailyVelocity).toBe(Math.round(1200 / 30.4375))

      const singleResult = calculateMonthlyVelocity(
        [{ yearMonth: '2026-08', odometer: 10000 }],
        1000,
      )
      expect(singleResult.isColdStart).toBe(true)
      expect(singleResult.monthlyVelocity).toBe(1000)
    })

    it('calculates average monthly velocity when 2 or more records exist', () => {
      const records = [
        { yearMonth: '2026-06', odometer: 10000 },
        { yearMonth: '2026-07', odometer: 11000 },
        { yearMonth: '2026-08', odometer: 12400 },
      ]

      const result = calculateMonthlyVelocity(records, 1000)
      expect(result.isColdStart).toBe(false)
      // 2400 km over 2 elapsed months = 1200 km/mo
      expect(result.monthlyVelocity).toBe(1200)
      expect(result.dailyVelocity).toBe(Math.round(1200 / 30.4375))
    })

    it('falls back safely if odometer delta is zero or negative', () => {
      const records = [
        { yearMonth: '2026-06', odometer: 20000 },
        { yearMonth: '2026-07', odometer: 20000 },
      ]

      const result = calculateMonthlyVelocity(records, 800)
      expect(result.isColdStart).toBe(true)
      expect(result.monthlyVelocity).toBe(800)
    })
  })

  describe('convertOdometerUnit', () => {
    it('converts miles to km and km to miles accurately', () => {
      expect(convertOdometerUnit(1000, 'miles', 'km')).toBe(1609)
      expect(convertOdometerUnit(1609, 'km', 'miles')).toBe(1000)
      expect(convertOdometerUnit(5000, 'km', 'km')).toBe(5000)
      expect(convertOdometerUnit(3000, 'miles', 'miles')).toBe(3000)
    })
  })

  describe('isOdometerTypoJump', () => {
    it('detects jumps larger than threshold (default 3,000)', () => {
      expect(isOdometerTypoJump(45000, 42000, 3000)).toBe(false)
      expect(isOdometerTypoJump(45001, 42000, 3000)).toBe(true)
      expect(isOdometerTypoJump(431000, 43100, 3000)).toBe(true)
    })
  })

  describe('formatOdometer', () => {
    it('formats numbers with commas and unit label', () => {
      expect(formatOdometer(45200, 'km')).toBe('45,200 km')
      expect(formatOdometer(12500, 'miles')).toBe('12,500 miles')
    })
  })

  describe('predictCurrentOdometer', () => {
    it('returns hasPrediction false if updated today (elapsedDays < 1)', () => {
      const now = new Date('2026-09-04T12:00:00Z')
      const updatedToday = '2026-09-04T08:00:00Z'
      const result = predictCurrentOdometer(18000, updatedToday, 1000, now)

      expect(result.hasPrediction).toBe(false)
      expect(result.elapsedDays).toBe(0)
      expect(result.predictedOdometer).toBe(18000)
    })

    it('returns hasPrediction false if lastUpdatedAt is null or invalid', () => {
      const now = new Date('2026-09-04T12:00:00Z')
      expect(predictCurrentOdometer(18000, null, 1000, now).hasPrediction).toBe(false)
      expect(predictCurrentOdometer(18000, 'invalid-date', 1000, now).hasPrediction).toBe(false)
    })

    it('calculates predicted odometer accurately when days have elapsed', () => {
      const now = new Date('2026-09-15T12:00:00Z')
      // 14 days prior
      const updated14DaysAgo = '2026-09-01T12:00:00Z'
      // 1000 km / 30.4375 days ≈ 32.85 km/day * 14 days ≈ 460 km
      const result = predictCurrentOdometer(18000, updated14DaysAgo, 1000, now)

      expect(result.hasPrediction).toBe(true)
      expect(result.elapsedDays).toBe(14)
      expect(result.predictedOdometer).toBe(18000 + Math.round(14 * (1000 / 30.4375)))
    })
  })
})
