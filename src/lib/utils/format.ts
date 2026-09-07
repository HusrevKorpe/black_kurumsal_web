const wholeFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const fractionFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Prisma Decimal, string veya number kabul eder. Tam sayıda kuruş yok: "₺120"; değilse iki hane: "₺120,50" */
export function formatPrice(value: { toString(): string } | number | string): string {
  const num = typeof value === 'number' ? value : Number(value.toString())
  if (!Number.isFinite(num)) return ''
  const isWhole = Math.abs(num - Math.round(num)) < 0.005
  return (isWhole ? wholeFormatter : fractionFormatter).format(num)
}

/** "₺120 / saat" — birim yoksa yalnız fiyat. */
export function formatPriceWithUnit(
  value: { toString(): string } | number | string,
  unit: string | null | undefined,
): string {
  const price = formatPrice(value)
  return unit ? `${price} / ${unit}` : price
}

/**
 * Türkiye numarasını uluslararası rakam dizisine çevirir: "0532 123 45 67" → "905321234567".
 * Geçersizse null.
 */
export function normalizeTrPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('90')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return `9${digits}`
  if (digits.length === 10) return `90${digits}`
  return null
}

/** "905321234567" → "0532 123 45 67" */
export function formatTrPhone(input: string): string {
  const normalized = normalizeTrPhone(input)
  if (!normalized) return input
  const d = normalized.slice(2)
  return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`
}

export function telHref(phone: string): string | null {
  const normalized = normalizeTrPhone(phone)
  return normalized ? `tel:+${normalized}` : null
}

export function whatsappHref(phone: string, text?: string): string | null {
  const normalized = normalizeTrPhone(phone)
  if (!normalized) return null
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${normalized}${query}`
}

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
})

/** "5 Eylül 2026" */
export function formatDateTr(date: Date): string {
  return dateFormatter.format(date)
}
