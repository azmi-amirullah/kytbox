import type { DocumentExpiryDetails, DocumentExpiryStatus } from '../types'

/**
 * Pure calculation helper for document & driver license expiration status.
 * Uses UTC date boundaries to eliminate timezone drift.
 */
export function calculateDocumentExpiry(
  expiryDateStr: string,
  nowDate: Date = new Date()
): DocumentExpiryDetails {
  if (!expiryDateStr) {
    return {
      status: 'expired',
      daysRemaining: 0,
      formattedDays: 'Invalid Date',
      isExpired: true,
      isExpiringSoon: false,
      badgeLabel: 'Invalid Date',
    }
  }

  // Parse YYYY-MM-DD cleanly at UTC midnight
  const parts = expiryDateStr.split('-').map((p) => parseInt(p, 10))
  if (parts.length !== 3 || parts.some((n) => isNaN(n))) {
    return {
      status: 'expired',
      daysRemaining: 0,
      formattedDays: 'Invalid Date',
      isExpired: true,
      isExpiringSoon: false,
      badgeLabel: 'Invalid Date',
    }
  }

  const [year, month, day] = parts
  const expiryUtc = Date.UTC(year, month - 1, day)
  const todayUtc = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate())

  const diffMs = expiryUtc - todayUtc
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24))

  let status: DocumentExpiryStatus = 'valid'
  let isExpired = false
  let isExpiringSoon = false
  let badgeLabel = ''
  let formattedDays = ''

  if (daysRemaining < 0) {
    status = 'expired'
    isExpired = true
    const abs = Math.abs(daysRemaining)
    formattedDays = `${abs} day${abs === 1 ? '' : 's'} ago`
    badgeLabel = `Expired (${abs}d ago)`
  } else if (daysRemaining === 0) {
    status = 'expiring_soon'
    isExpiringSoon = true
    formattedDays = 'Today'
    badgeLabel = 'Expires Today'
  } else if (daysRemaining <= 30) {
    status = 'expiring_soon'
    isExpiringSoon = true
    formattedDays = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    badgeLabel = `Expires in ${daysRemaining}d`
  } else {
    status = 'valid'
    formattedDays = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    badgeLabel = `Valid (${daysRemaining}d left)`
  }

  return {
    status,
    daysRemaining,
    formattedDays,
    isExpired,
    isExpiringSoon,
    badgeLabel,
  }
}

/**
 * Advances an expiry date by 1 year, 5 years, or 6 months, or uses custom date.
 * Preserves day-of-month and handles month overflows safely (e.g. leap year Feb 29).
 * If fromTodayIfExpired is true and currentExpiryStr is in the past, advances from today instead.
 */
export function advanceExpiryDate(
  currentExpiryStr: string,
  unit: '1y' | '5y' | '6m' | 'custom',
  customDate?: string,
  fromTodayIfExpired: boolean = false,
  nowDate: Date = new Date()
): string {
  if (unit === 'custom') {
    return customDate || advanceExpiryDate(currentExpiryStr, '1y', undefined, fromTodayIfExpired, nowDate)
  }

  let baseDateStr = currentExpiryStr
  if (fromTodayIfExpired) {
    const todayUtcMidnight = new Date(
      Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate())
    )
    const parts = currentExpiryStr.split('-').map((p) => parseInt(p, 10))
    if (parts.length === 3 && !parts.some((n) => isNaN(n))) {
      const [y, m, d] = parts
      const expiryUtc = Date.UTC(y, m - 1, d)
      if (expiryUtc < todayUtcMidnight.getTime()) {
        const pad = (n: number) => String(n).padStart(2, '0')
        baseDateStr = `${nowDate.getUTCFullYear()}-${pad(nowDate.getUTCMonth() + 1)}-${pad(nowDate.getUTCDate())}`
      }
    }
  }

  const parts = baseDateStr.split('-').map((p) => parseInt(p, 10))
  if (parts.length !== 3 || parts.some((n) => isNaN(n))) {
    return currentExpiryStr
  }

  const [year, month, day] = parts
  let newYear = year
  let newMonth = month
  let newDay = day

  if (unit === '1y') {
    newYear += 1
  } else if (unit === '5y') {
    newYear += 5
  } else if (unit === '6m') {
    newMonth += 6
    if (newMonth > 12) {
      newYear += Math.floor((newMonth - 1) / 12)
      newMonth = ((newMonth - 1) % 12) + 1
    }
  }

  // Adjust day if target month has fewer days (e.g. Feb 29 on non-leap year -> Feb 28)
  const maxDaysInMonth = new Date(Date.UTC(newYear, newMonth, 0)).getUTCDate()
  if (newDay > maxDaysInMonth) {
    newDay = maxDaysInMonth
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${newYear}-${pad(newMonth)}-${pad(newDay)}`
}

/**
 * Scans existing cashflow book categories for automotive/tax keywords.
 * Supports array of category names or category objects.
 * Returns the best match name or null.
 */
export function matchCashflowCategory(
  categories: (string | { id?: string; name: string })[],
  documentTitle?: string
): string | null {
  if (!categories || categories.length === 0) return null

  const titleLower = documentTitle ? documentTitle.toLowerCase() : ''
  const isTax =
    titleLower.includes('pajak') || titleLower.includes('tax') || titleLower.includes('pkb')
  const isInsurance =
    titleLower.includes('insurance') || titleLower.includes('asuransi')

  const TARGET_KEYWORDS = [
    ...(isInsurance ? ['insurance', 'asuransi'] : []),
    ...(isTax ? ['pajak', 'tax'] : []),
    'transport',
    'vehicle',
    'kendaraan',
    'pajak',
    'tax',
    'automotive',
    'mobil',
    'motor',
    'bensin',
    'insurance',
    'asuransi',
  ]

  for (const keyword of TARGET_KEYWORDS) {
    const found = categories.find((c) => {
      const name = typeof c === 'string' ? c : c?.name
      return typeof name === 'string' && name.toLowerCase().includes(keyword)
    })
    if (found) {
      return typeof found === 'string' ? found : found.name
    }
  }

  return null
}
