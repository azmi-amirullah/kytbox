import type { CashflowEntryDTO } from '@/types/dto'
import { parseDateOnly, toLocalDateOnlyString } from '@/lib/date-only'

export type TrailingWindowDays = 30 | 60 | 90

export type RunwayStatus =
  | 'healthy'
  | 'moderate'
  | 'critical'
  | 'depleted'
  | 'profitable'

export interface RunwayOptions {
  balance: number
  entries: CashflowEntryDTO[]
  windowDays?: TrailingWindowDays
  referenceDate?: Date
}

export interface RunwayResult {
  currentBalance: number
  windowDays: TrailingWindowDays
  totalIncome: number
  totalExpense: number
  entryCount: number
  monthlyGrossBurn: number
  monthlyIncomeRate: number
  monthlyNetBurn: number
  dailyGrossBurn: number
  dailyNetBurn: number
  zeroIncomeRunwayMonths: number
  zeroIncomeRunwayDays: number
  netRunwayMonths: number
  status: RunwayStatus
  isProfitable: boolean
  projectedZeroDate: string | null
}

const AVERAGE_DAYS_PER_MONTH = 30.4375

/**
 * Calculates trailing burn rate and survival runway based on settled cashflow entries.
 */
export function calculateRunway({
  balance,
  entries,
  windowDays = 90,
  referenceDate = new Date(),
}: RunwayOptions): RunwayResult {
  const currentBalance = Number.isFinite(balance) ? balance : 0
  const normalizedWindowDays: TrailingWindowDays =
    windowDays === 30 || windowDays === 60 || windowDays === 90
      ? windowDays
      : 90

  // Standardize reference date to local midnight
  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )
  const windowStartMs =
    refStart.getTime() - (normalizedWindowDays - 1) * 24 * 60 * 60 * 1000

  let totalIncome = 0
  let totalExpense = 0
  let entryCount = 0

  for (const entry of entries) {
    if (!entry.date) continue
    const entryDate = parseDateOnly(entry.date)
    const entryTime = entryDate.getTime()

    // Must be within [windowStartDate, refStart]
    if (entryTime >= windowStartMs && entryTime <= refStart.getTime()) {
      entryCount++
      const amount = Math.abs(Number(entry.amount)) || 0
      if (entry.type === 'income') {
        totalIncome += amount
      } else if (entry.type === 'expense') {
        totalExpense += amount
      }
    }
  }

  const dailyGrossBurn = totalExpense / normalizedWindowDays
  const monthlyGrossBurn = dailyGrossBurn * AVERAGE_DAYS_PER_MONTH

  const dailyIncomeRate = totalIncome / normalizedWindowDays
  const monthlyIncomeRate = dailyIncomeRate * AVERAGE_DAYS_PER_MONTH

  const dailyNetBurn = (totalExpense - totalIncome) / normalizedWindowDays
  const monthlyNetBurn = dailyNetBurn * AVERAGE_DAYS_PER_MONTH

  const isProfitable = monthlyNetBurn <= 0

  let zeroIncomeRunwayMonths: number
  let zeroIncomeRunwayDays: number
  let projectedZeroDate: string | null = null

  if (currentBalance <= 0) {
    zeroIncomeRunwayMonths = 0
    zeroIncomeRunwayDays = 0
    projectedZeroDate = null
  } else if (dailyGrossBurn <= 0) {
    zeroIncomeRunwayMonths = Number.POSITIVE_INFINITY
    zeroIncomeRunwayDays = Number.POSITIVE_INFINITY
    projectedZeroDate = null
  } else {
    zeroIncomeRunwayDays = Math.floor(currentBalance / dailyGrossBurn)
    zeroIncomeRunwayMonths =
      Math.round((currentBalance / monthlyGrossBurn) * 10) / 10

    const zeroDateMs =
      refStart.getTime() + zeroIncomeRunwayDays * 24 * 60 * 60 * 1000
    projectedZeroDate = toLocalDateOnlyString(new Date(zeroDateMs))
  }

  let netRunwayMonths: number
  if (currentBalance <= 0) {
    netRunwayMonths = 0
  } else if (monthlyNetBurn <= 0) {
    netRunwayMonths = Number.POSITIVE_INFINITY
  } else {
    netRunwayMonths = Math.round((currentBalance / monthlyNetBurn) * 10) / 10
  }

  let status: RunwayStatus
  if (currentBalance <= 0) {
    status = 'depleted'
  } else if (isProfitable) {
    status = 'profitable'
  } else if (zeroIncomeRunwayMonths < 3) {
    status = 'critical'
  } else if (zeroIncomeRunwayMonths < 6) {
    status = 'moderate'
  } else {
    status = 'healthy'
  }

  return {
    currentBalance,
    windowDays: normalizedWindowDays,
    totalIncome,
    totalExpense,
    entryCount,
    monthlyGrossBurn,
    monthlyIncomeRate,
    monthlyNetBurn,
    dailyGrossBurn,
    dailyNetBurn,
    zeroIncomeRunwayMonths,
    zeroIncomeRunwayDays,
    netRunwayMonths,
    status,
    isProfitable,
    projectedZeroDate,
  }
}
