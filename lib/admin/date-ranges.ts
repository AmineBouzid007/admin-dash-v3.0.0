import type { DateFilterPreset, DateRange } from "@/lib/types"

function startOfDay(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay(d: Date) {
  const copy = new Date(d)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export const DATE_FILTER_OPTIONS: { value: DateFilterPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
]

/**
 * Resolve a date filter preset into a concrete inclusive [from, to] ISO range.
 * For "custom", pass explicit from/to values which are returned as-is.
 */
export function resolveDateRange(
  preset: DateFilterPreset,
  custom?: { from?: string; to?: string }
): DateRange {
  const now = new Date()

  switch (preset) {
    case "today": {
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() }
    }
    case "yesterday": {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString() }
    }
    case "7d": {
      const from = new Date(now)
      from.setDate(from.getDate() - 6)
      return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() }
    }
    case "30d": {
      const from = new Date(now)
      from.setDate(from.getDate() - 29)
      return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() }
    }
    case "this_month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() }
    }
    case "this_year": {
      const from = new Date(now.getFullYear(), 0, 1)
      return { from: startOfDay(from).toISOString(), to: endOfDay(now).toISOString() }
    }
    case "custom": {
      const from = custom?.from ? startOfDay(new Date(custom.from)).toISOString() : startOfDay(now).toISOString()
      const to = custom?.to ? endOfDay(new Date(custom.to)).toISOString() : endOfDay(now).toISOString()
      return { from, to }
    }
    default:
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() }
  }
}

export function formatDay(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
}

export function eachDayBetween(fromISO: string, toISO: string): string[] {
  const days: string[] = []
  const cur = startOfDay(new Date(fromISO))
  const end = startOfDay(new Date(toISO))
  // safety cap to avoid runaway loops on bad input
  let guard = 0
  while (cur.getTime() <= end.getTime() && guard < 400) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
    guard++
  }
  return days
}
