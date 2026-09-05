import type { OdometerUnit, RuleDueStatus, VehicleMaintenanceRuleDTO } from '../types'

export interface CalculateRuleOptions {
  currentOdometer: number
  unit?: OdometerUnit
  nowDate?: Date
}

/**
 * Pure calculation engine for vehicle maintenance rule status.
 * Evaluates both distance and time intervals under the "whichever comes first" principle.
 */
export function calculateRuleDueStatus(
  rule: Pick<
    VehicleMaintenanceRuleDTO,
    | 'interval_distance'
    | 'interval_months'
    | 'last_service_odometer'
    | 'last_service_date'
    | 'is_active'
  >,
  options: CalculateRuleOptions
): RuleDueStatus {
  const { currentOdometer, unit = 'km', nowDate = new Date() } = options

  if (!rule.is_active) {
    return {
      status: 'untracked',
      remainingDistance: null,
      remainingDays: null,
      percentRemaining: null,
      isOverdue: false,
      isDueSoon: false,
      primaryTrigger: 'none',
    }
  }

  // 1. Calculate Remaining Distance
  let remainingDistance: number | null = null
  let distancePercent: number | null = null
  if (
    rule.interval_distance != null &&
    rule.interval_distance > 0 &&
    rule.last_service_odometer != null
  ) {
    const targetOdo = rule.last_service_odometer + rule.interval_distance
    remainingDistance = targetOdo - currentOdometer
    const elapsedDistance = currentOdometer - rule.last_service_odometer
    const pct = Math.max(0, 100 - (elapsedDistance / rule.interval_distance) * 100)
    distancePercent = Math.min(100, Math.round(pct))
  }

  // 2. Calculate Remaining Days
  let remainingDays: number | null = null
  let timePercent: number | null = null
  if (rule.interval_months != null && rule.interval_months > 0 && rule.last_service_date) {
    const lastDate = new Date(rule.last_service_date)
    if (!isNaN(lastDate.getTime())) {
      // Advance by months
      const targetDate = new Date(lastDate)
      targetDate.setMonth(targetDate.getMonth() + rule.interval_months)

      const diffMs = targetDate.getTime() - nowDate.getTime()
      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      const totalSpanMs = targetDate.getTime() - lastDate.getTime()
      if (totalSpanMs > 0) {
        const pct = Math.max(0, (diffMs / totalSpanMs) * 100)
        timePercent = Math.min(100, Math.round(pct))
      }
    }
  }

  // If neither distance nor time can be evaluated, status is untracked
  if (remainingDistance === null && remainingDays === null) {
    return {
      status: 'untracked',
      remainingDistance: null,
      remainingDays: null,
      percentRemaining: null,
      isOverdue: false,
      isDueSoon: false,
      primaryTrigger: 'none',
    }
  }

  const dueSoonDistanceThreshold = unit === 'miles' ? 300 : 500
  const dueSoonDaysThreshold = 14

  const isDistOverdue = remainingDistance !== null && remainingDistance <= 0
  const isTimeOverdue = remainingDays !== null && remainingDays <= 0
  const isOverdue = isDistOverdue || isTimeOverdue

  const isDistDueSoon =
    remainingDistance !== null && remainingDistance > 0 && remainingDistance <= dueSoonDistanceThreshold
  const isTimeDueSoon =
    remainingDays !== null && remainingDays > 0 && remainingDays <= dueSoonDaysThreshold
  const isDueSoon = !isOverdue && (isDistDueSoon || isTimeDueSoon)

  let status: 'good' | 'due_soon' | 'overdue' = 'good'
  if (isOverdue) {
    status = 'overdue'
  } else if (isDueSoon) {
    status = 'due_soon'
  }

  // Determine primary trigger
  let primaryTrigger: 'distance' | 'time' | 'both' | 'none' = 'none'
  if (isDistOverdue && isTimeOverdue) {
    primaryTrigger = 'both'
  } else if (isDistOverdue) {
    primaryTrigger = 'distance'
  } else if (isTimeOverdue) {
    primaryTrigger = 'time'
  } else if (isDistDueSoon && isTimeDueSoon) {
    primaryTrigger = 'both'
  } else if (isDistDueSoon) {
    primaryTrigger = 'distance'
  } else if (isTimeDueSoon) {
    primaryTrigger = 'time'
  } else if (remainingDistance !== null && remainingDays !== null) {
    // If both active, trigger is whichever percentage is lower
    if ((distancePercent ?? 100) <= (timePercent ?? 100)) {
      primaryTrigger = 'distance'
    } else {
      primaryTrigger = 'time'
    }
  } else if (remainingDistance !== null) {
    primaryTrigger = 'distance'
  } else if (remainingDays !== null) {
    primaryTrigger = 'time'
  }

  // Remaining percent is lowest of the active dimensions
  let percentRemaining: number | null = null
  if (distancePercent !== null && timePercent !== null) {
    percentRemaining = Math.min(distancePercent, timePercent)
  } else if (distancePercent !== null) {
    percentRemaining = distancePercent
  } else if (timePercent !== null) {
    percentRemaining = timePercent
  }

  return {
    status,
    remainingDistance,
    remainingDays,
    percentRemaining,
    isOverdue,
    isDueSoon,
    primaryTrigger,
  }
}

export interface RuleWithStatusItem {
  rule: VehicleMaintenanceRuleDTO
  status: RuleDueStatus
}

/**
 * Sorts vehicle maintenance rule items by urgency:
 * 1. Active items before inactive items (inactive always at the bottom)
 * 2. Lower percentage remaining first (ascending: overdue 0% -> due soon -> 100% good standing)
 * 3. Tie-breaker for equal percentages: lowest remaining distance / remaining days first
 * 4. Untracked items (null percentage) placed after tracked items
 */
export function sortRulesByUrgency(items: RuleWithStatusItem[]): RuleWithStatusItem[] {
  return [...items].sort((a, b) => {
    // 1. Active vs Inactive (inactive always at the bottom)
    if (a.rule.is_active !== b.rule.is_active) {
      return a.rule.is_active ? -1 : 1
    }

    const aPct = a.status.percentRemaining
    const bPct = b.status.percentRemaining

    // 2. Untracked (null percent) after tracked items
    if (aPct === null && bPct === null) {
      return a.rule.name.localeCompare(b.rule.name)
    }
    if (aPct === null) return 1
    if (bPct === null) return -1

    // 3. Lower percentage remaining first (ascending)
    if (aPct !== bPct) {
      return aPct - bPct
    }

    // 4. Tie-breaker 1: If both have remaining distance, lowest remaining distance first
    if (a.status.remainingDistance !== null && b.status.remainingDistance !== null) {
      if (a.status.remainingDistance !== b.status.remainingDistance) {
        return a.status.remainingDistance - b.status.remainingDistance
      }
    }

    // 5. Tie-breaker 2: If both have remaining days, lowest remaining days first
    if (a.status.remainingDays !== null && b.status.remainingDays !== null) {
      if (a.status.remainingDays !== b.status.remainingDays) {
        return a.status.remainingDays - b.status.remainingDays
      }
    }

    // 6. Alphabetical fallback
    return a.rule.name.localeCompare(b.rule.name)
  })
}

