import { format } from 'date-fns'

export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date(value)

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
}

export function formatAppDate(
  value: string | Date | null | undefined,
  fallback = '-',
): string {
  if (!value) return fallback
  try {
    const dateObj = typeof value === 'string' ? parseDateOnly(value) : value
    if (isNaN(dateObj.getTime())) return fallback
    return format(dateObj, 'dd MMM yyyy')
  } catch {
    return fallback
  }
}
