/** Karışıklığa açık karakterler (0/O, 1/l/I) dışarıda; şifre telefonda dikte edilebilsin. */
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghjkmnpqrstuvwxyz'
const DIGITS = '23456789'
const ALPHABET = UPPER + LOWER + DIGITS

/**
 * Panelin şifre kuralının tek kaynağı. Zod şeması (`src/features/staff/schema.ts`) ve form
 * alanlarının `minLength`'i aynı sayıyı buradan okur; biri değişip diğeri unutulamaz.
 */
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 72

/**
 * [0, bound) aralığında kriptografik rastgele tam sayı. Reddetme örneklemesi: 2^32'nin bound'a
 * tam bölünmeyen artığı atılır, böylece modulo yanlılığı olmaz.
 */
function randomIndex(bound: number): number {
  const limit = Math.floor(2 ** 32 / bound) * bound
  const buffer = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(buffer)
    value = buffer[0]!
  } while (value >= limit)
  return value % bound
}

const pick = (chars: string): string => chars.charAt(randomIndex(chars.length))

/**
 * Kriptografik rastgele şifre (16 karakter ≈ 92 bit). Panelin şifre kuralını (12–72 karakter,
 * en az bir küçük harf, bir büyük harf ve bir rakam — `src/features/staff/schema.ts` ve
 * `supabase/config.toml`) her zaman sağlar: üç ayrı konuma garanti karakter yerleştirilir.
 *
 * Node'a bağlı değil, Web Crypto kullanır: panelin "Şifre Üret" düğmesi bunu tarayıcıda,
 * `scripts/create-owner.ts` ise Node'da çağırır. İki tarafta tek kaynak.
 */
export function generatePassword(length = 16): string {
  if (!Number.isInteger(length) || length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
    throw new RangeError(
      `Şifre uzunluğu ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} arasında olmalı`,
    )
  }
  const chars = Array.from({ length }, () => pick(ALPHABET))
  // Kısmi Fisher-Yates: seçilen konum havuzdan düşer, üç garanti karakter birbirini ezmez.
  const free = Array.from({ length }, (_, i) => i)
  for (const required of [LOWER, UPPER, DIGITS]) {
    const slot = randomIndex(free.length)
    chars[free[slot]!] = pick(required)
    free[slot] = free[free.length - 1]!
    free.pop()
  }
  return chars.join('')
}
