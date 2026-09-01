export type SortOption =
  | 'last_activity'
  | 'created_desc'
  | 'created_asc'
  | 'title_asc'
  | 'title_desc'
  | 'metric_desc'
  | 'metric_asc'

export interface SortAccessors<T> {
  getTitle?: (item: T) => string
  getCreatedAt?: (item: T) => string | number | Date | null | undefined
  getLastActivity?: (item: T) => string | number | Date | null | undefined
  getMetric?: (item: T) => number | null | undefined
}

/**
 * Parses any date-like input (ISO string, epoch ms, Date) safely to a numeric timestamp.
 * Returns 0 for invalid/missing values.
 */
function toTimestamp(val: string | number | Date | null | undefined): number {
  if (!val) return 0
  if (typeof val === 'number') return val
  const parsed = new Date(val).getTime()
  return isNaN(parsed) ? 0 : parsed
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null
}

function getRecordString(item: unknown, ...keys: string[]): string | undefined {
  if (isRecord(item)) {
    for (const key of keys) {
      const val = item[key]
      if (typeof val === 'string') return val
    }
  }
  return undefined
}

function getRecordDateValue(
  item: unknown,
  ...keys: string[]
): string | number | Date | undefined {
  if (isRecord(item)) {
    for (const key of keys) {
      const val = item[key]
      if (
        typeof val === 'string' ||
        typeof val === 'number' ||
        val instanceof Date
      ) {
        return val
      }
    }
  }
  return undefined
}

function getRecordNumber(item: unknown, ...keys: string[]): number | undefined {
  if (isRecord(item)) {
    for (const key of keys) {
      const val = item[key]
      if (typeof val === 'number') return val
    }
  }
  return undefined
}

/**
 * Generic, type-safe entity sorting helper.
 * Returns a new sorted array without mutating the original.
 */
export function sortEntities<T>(
  items: T[],
  sortBy: SortOption,
  accessors: SortAccessors<T> = {},
): T[] {
  const {
    getTitle = (item: T) => getRecordString(item, 'title', 'name') ?? '',
    getCreatedAt = (item: T) => getRecordDateValue(item, 'created_at', 'createdAt'),
    getLastActivity = (item: T) =>
      getRecordDateValue(
        item,
        'last_entry_at',
        'lastEntryAt',
        'updated_at',
        'updatedAt',
        'created_at',
        'createdAt',
      ),
    getMetric = (item: T) => getRecordNumber(item, 'balance', 'amount', 'count') ?? 0,
  } = accessors

  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'last_activity': {
        const timeA = toTimestamp(getLastActivity(a))
        const timeB = toTimestamp(getLastActivity(b))
        if (timeB !== timeA) return timeB - timeA
        return getTitle(a).localeCompare(getTitle(b))
      }

      case 'created_desc': {
        const timeA = toTimestamp(getCreatedAt(a))
        const timeB = toTimestamp(getCreatedAt(b))
        if (timeB !== timeA) return timeB - timeA
        return getTitle(a).localeCompare(getTitle(b))
      }

      case 'created_asc': {
        const timeA = toTimestamp(getCreatedAt(a))
        const timeB = toTimestamp(getCreatedAt(b))
        if (timeA !== timeB) return timeA - timeB
        return getTitle(a).localeCompare(getTitle(b))
      }

      case 'title_asc':
        return getTitle(a).localeCompare(getTitle(b), undefined, {
          sensitivity: 'base',
          numeric: true,
        })

      case 'title_desc':
        return getTitle(b).localeCompare(getTitle(a), undefined, {
          sensitivity: 'base',
          numeric: true,
        })

      case 'metric_desc': {
        const metA = Number(getMetric(a)) || 0
        const metB = Number(getMetric(b)) || 0
        if (metB !== metA) return metB - metA
        return getTitle(a).localeCompare(getTitle(b))
      }

      case 'metric_asc': {
        const metA = Number(getMetric(a)) || 0
        const metB = Number(getMetric(b)) || 0
        if (metA !== metB) return metA - metB
        return getTitle(a).localeCompare(getTitle(b))
      }

      default:
        return 0
    }
  })
}
