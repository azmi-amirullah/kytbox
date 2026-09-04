import type { OdometerUnit } from '@/types/dto'

export const KM_PER_MILE = 1.609344

export function convertOdometerUnit(
  val: number,
  from: OdometerUnit,
  to: OdometerUnit,
): number {
  if (from === to) return val
  if (from === 'miles' && to === 'km') {
    return Math.round(val * KM_PER_MILE)
  }
  if (from === 'km' && to === 'miles') {
    return Math.round(val / KM_PER_MILE)
  }
  return val
}

export interface MonthlyOdometerRecord {
  yearMonth: string
  odometer: number
}

export interface VelocityResult {
  monthlyVelocity: number
  dailyVelocity: number
  isColdStart: boolean
}

/**
 * Calculates monthly and daily velocity from rolling monthly odometer snapshots.
 * If fewer than 2 snapshots exist or the calculated velocity is non-positive,
 * falls back gracefully to the vehicle's estimated_monthly_km to prevent NaN or division-by-zero.
 */
export function calculateMonthlyVelocity(
  records: MonthlyOdometerRecord[],
  fallbackEstimatedMonthly = 1000,
): VelocityResult {
  const safeFallback = fallbackEstimatedMonthly > 0 ? fallbackEstimatedMonthly : 1000
  const safeDailyFallback = Math.round(safeFallback / 30.4375)

  if (!records || records.length < 2) {
    return {
      monthlyVelocity: safeFallback,
      dailyVelocity: safeDailyFallback,
      isColdStart: true,
    }
  }

  // Sort ascending by yearMonth (e.g. '2026-04', '2026-05', ...)
  const sorted = [...records].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
  const oldest = sorted[0]
  const latest = sorted[sorted.length - 1]

  if (!oldest || !latest) {
    return {
      monthlyVelocity: safeFallback,
      dailyVelocity: safeDailyFallback,
      isColdStart: true,
    }
  }

  const deltaOdo = latest.odometer - oldest.odometer

  // Calculate elapsed months between oldest and latest
  const [oldYear, oldMonth] = oldest.yearMonth.split('-').map(Number)
  const [newYear, newMonth] = latest.yearMonth.split('-').map(Number)

  if (
    typeof oldYear !== 'number' ||
    typeof oldMonth !== 'number' ||
    typeof newYear !== 'number' ||
    typeof newMonth !== 'number' ||
    isNaN(oldYear) ||
    isNaN(oldMonth) ||
    isNaN(newYear) ||
    isNaN(newMonth)
  ) {
    return {
      monthlyVelocity: safeFallback,
      dailyVelocity: safeDailyFallback,
      isColdStart: true,
    }
  }

  const elapsedMonths = (newYear - oldYear) * 12 + (newMonth - oldMonth)

  if (elapsedMonths <= 0 || deltaOdo <= 0) {
    return {
      monthlyVelocity: safeFallback,
      dailyVelocity: safeDailyFallback,
      isColdStart: true,
    }
  }

  const monthlyVelocity = Math.round(deltaOdo / elapsedMonths)
  const dailyVelocity = Math.round(monthlyVelocity / 30.4375)

  return {
    monthlyVelocity,
    dailyVelocity: Math.max(1, dailyVelocity),
    isColdStart: false,
  }
}

/**
 * Checks whether a single odometer jump exceeds 3,000 units (Fat-Finger Typo Guard)
 */
export function isOdometerTypoJump(
  newOdometer: number,
  currentOdometer: number,
  threshold = 3000,
): boolean {
  return newOdometer - currentOdometer > threshold
}

/**
 * Formats odometer number cleanly with comma/dot grouping and unit badge
 */
export function formatOdometer(value: number, unit: OdometerUnit = 'km'): string {
  const formatted = new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)))
  return `${formatted} ${unit}`
}

export interface PredictedOdometerResult {
  predictedOdometer: number
  elapsedDays: number
  hasPrediction: boolean
}

/**
 * Predicts the vehicle's current odometer based on elapsed days since the last log
 * and daily driving velocity. Only returns hasPrediction = true if at least 1 full day has elapsed.
 */
export function predictCurrentOdometer(
  currentOdometer: number,
  lastUpdatedAt: string | null | undefined,
  monthlyVelocity = 1000,
  referenceDate: Date = new Date(),
): PredictedOdometerResult {
  if (!lastUpdatedAt) {
    return {
      predictedOdometer: currentOdometer,
      elapsedDays: 0,
      hasPrediction: false,
    }
  }

  const lastDate = new Date(lastUpdatedAt)
  if (isNaN(lastDate.getTime())) {
    return {
      predictedOdometer: currentOdometer,
      elapsedDays: 0,
      hasPrediction: false,
    }
  }

  const diffMs = referenceDate.getTime() - lastDate.getTime()
  const elapsedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (elapsedDays < 1) {
    return {
      predictedOdometer: currentOdometer,
      elapsedDays: 0,
      hasPrediction: false,
    }
  }

  const safeMonthly = monthlyVelocity > 0 ? monthlyVelocity : 1000
  const dailyVelocity = safeMonthly / 30.4375
  const deltaOdo = Math.round(elapsedDays * dailyVelocity)

  return {
    predictedOdometer: currentOdometer + deltaOdo,
    elapsedDays,
    hasPrediction: true,
  }
}

