import { parseHm } from './time'
import type { DayOfWeek, HoursEntry } from './types'

export const DAY_NAMES: Record<DayOfWeek, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
}

export const DAY_NAMES_SHORT: Record<DayOfWeek, string> = {
  1: 'Pzt',
  2: 'Sal',
  3: 'Çar',
  4: 'Per',
  5: 'Cum',
  6: 'Cmt',
  7: 'Paz',
}

/** "10:00 – 02:00", "24 saat", "Kapalı" */
export function formatHoursEntry(entry: HoursEntry): string {
  if (entry.isClosed || !entry.opensAt || !entry.closesAt) return 'Kapalı'
  const opens = parseHm(entry.opensAt)
  const closes = parseHm(entry.closesAt)
  if (opens !== null && closes !== null && opens === closes) return '24 saat'
  return `${entry.opensAt} – ${entry.closesAt}`
}
