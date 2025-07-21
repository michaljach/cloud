// Utility to format a date string or Date object to a locale string
export function formatDate(
  date: string | Date,
  locale: string = 'default',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(locale, options)
}
