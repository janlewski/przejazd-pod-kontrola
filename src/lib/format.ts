const LOCALE = 'pl-PL'

const integerFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const decimalFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 })
const percentFormat = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
})
const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const monthFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Polish grouping uses a non-breaking space; 4-digit numbers are not grouped by Intl. */
export function formatInt(value: number): string {
  return integerFormat.format(value)
}

export function formatDecimal(value: number): string {
  return decimalFormat.format(value)
}

export function formatPercent(ratio: number): string {
  return percentFormat.format(ratio)
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`))
}

export function formatMonth(period: string): string {
  return monthFormat.format(new Date(`${period}-01T00:00:00Z`))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

const coordFormat = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 5, maximumFractionDigits: 5 })

export function formatCoord(value: number): string {
  return coordFormat.format(value)
}

export function formatMeters(value: number): string {
  return `${formatInt(Math.round(value))} m`
}

export function formatOrMissing(value: number | null, missing = 'brak danych'): string {
  return value === null ? missing : formatInt(value)
}

/**
 * Line number and kilometre from the 9-digit crossing identification number
 * (gov.pl, „Przejazdy kolejowo-drogowe — numer alarmowy 112”: line number + line kilometre).
 */
export function parseCrossingNumber(name: string): { line: string; km: string } | null {
  const m = /^(\d{3}) (\d{3}) (\d{3})$/.exec(name.trim())
  if (!m) return null
  const km = Number(`${m[2]}.${m[3]}`)
  return { line: m[1]!, km: km.toLocaleString(LOCALE, { minimumFractionDigits: 3 }) }
}
