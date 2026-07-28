export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date(value)

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
}
