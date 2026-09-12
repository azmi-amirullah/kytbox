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
    const parts = rule.last_service_date.split('-').map((p) => parseInt(p, 10))
    if (parts.length === 3 && !parts.some((n) => isNaN(n))) {
      const [year, month, day] = parts
      let newYear = year
      let newMonth = month + rule.interval_months
      if (newMonth > 12) {
        newYear += Math.floor((newMonth - 1) / 12)
        newMonth = ((newMonth - 1) % 12) + 1
      }
      const maxDaysInMonth = new Date(Date.UTC(newYear, newMonth, 0)).getUTCDate()
      const newDay = Math.min(day, maxDaysInMonth)

      const targetUtc = Date.UTC(newYear, newMonth - 1, newDay)
      const lastUtc = Date.UTC(year, month - 1, day)
      const nowUtc = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate())

      const diffMs = targetUtc - nowUtc
      remainingDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

      const totalSpanMs = targetUtc - lastUtc
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

export interface MaintenancePrediction {
  status: 'good' | 'due_soon' | 'overdue' | 'untracked'
  overdueCount: number
  dueSoonCount: number
  goodCount: number
  untrackedCount: number
  mostUrgentRule: RuleWithStatusItem | null
  nextDueDistance: number | null
  nextDueDate: string | null
}

/**
 * Evaluates all vehicle maintenance rules to predict the next due service
 * and aggregate fleet health indicators.
 */
export function predictNextMaintenance(
  rules: VehicleMaintenanceRuleDTO[],
  options: CalculateRuleOptions
): MaintenancePrediction {
  const { nowDate = new Date() } = options

  if (!rules || rules.length === 0) {
    return {
      status: 'untracked',
      overdueCount: 0,
      dueSoonCount: 0,
      goodCount: 0,
      untrackedCount: 0,
      mostUrgentRule: null,
      nextDueDistance: null,
      nextDueDate: null,
    }
  }

  const itemsWithStatus: RuleWithStatusItem[] = rules.map((rule) => ({
    rule,
    status: calculateRuleDueStatus(rule, options),
  }))

  const activeItems = itemsWithStatus.filter((item) => item.rule.is_active)
  const untrackedCount = itemsWithStatus.filter((item) => item.status.status === 'untracked').length
  const overdueCount = activeItems.filter((item) => item.status.status === 'overdue').length
  const dueSoonCount = activeItems.filter((item) => item.status.status === 'due_soon').length
  const goodCount = activeItems.filter((item) => item.status.status === 'good').length

  let overallStatus: 'good' | 'due_soon' | 'overdue' | 'untracked' = 'untracked'
  if (activeItems.length > 0) {
    if (overdueCount > 0) {
      overallStatus = 'overdue'
    } else if (dueSoonCount > 0) {
      overallStatus = 'due_soon'
    } else if (goodCount > 0) {
      overallStatus = 'good'
    }
  }

  const sortedActive = sortRulesByUrgency(activeItems)
  const mostUrgentRule = sortedActive[0] || null

  let nextDueDistance: number | null = null
  let nextDueDate: string | null = null

  if (mostUrgentRule) {
    nextDueDistance = mostUrgentRule.status.remainingDistance

    if (mostUrgentRule.status.remainingDays != null) {
      const todayUtc = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate())
      const targetDate = new Date(todayUtc + mostUrgentRule.status.remainingDays * 86400000)
      if (!isNaN(targetDate.getTime())) {
        nextDueDate = targetDate.toISOString().slice(0, 10)
      }
    }
  }

  return {
    status: overallStatus,
    overdueCount,
    dueSoonCount,
    goodCount,
    untrackedCount,
    mostUrgentRule,
    nextDueDistance,
    nextDueDate,
  }
}

