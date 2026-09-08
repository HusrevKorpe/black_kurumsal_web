import { randomInt } from 'node:crypto'

/** Karışıklığa açık karakterler (0/O, 1/l/I) dışarıda; şifre telefonda dikte edilebilsin. */
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghjkmnpqrstuvwxyz'
const DIGITS = '23456789'
const ALPHABET = UPPER + LOWER + DIGITS

const pick = (chars: string): string => chars.charAt(randomInt(chars.length))

/**
 * Kriptografik rastgele şifre (16 karakter ≈ 92 bit). Panelin şifre kuralını (12–72 karakter,
 * en az bir küçük harf, bir büyük harf ve bir rakam — `src/features/staff/schema.ts` ve
 * `supabase/config.toml`) her zaman sağlar: üç ayrı konuma garanti karakter yerleştirilir.
 */
export function generatePassword(length = 16): string {
  if (!Number.isInteger(length) || length < 12 || length > 72) {
    throw new RangeError('Şifre uzunluğu 12–72 arasında olmalı')
  }
  const chars = Array.from({ length }, () => pick(ALPHABET))
  // Kısmi Fisher-Yates: seçilen konum havuzdan düşer, üç garanti karakter birbirini ezmez.
  const free = Array.from({ length }, (_, i) => i)
  for (const required of [LOWER, UPPER, DIGITS]) {
    const slot = randomInt(free.length)
    chars[free[slot]!] = pick(required)
    free[slot] = free[free.length - 1]!
    free.pop()
  }
  return chars.join('')
}
