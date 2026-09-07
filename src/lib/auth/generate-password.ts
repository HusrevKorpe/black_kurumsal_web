import { randomInt } from 'node:crypto'

/** Karışıklığa açık karakterler (0/O, 1/l/I) dışarıda; şifre telefonda dikte edilebilsin. */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
const DIGITS = '23456789'
const ALPHABET = LETTERS + DIGITS

const pick = (chars: string): string => chars.charAt(randomInt(chars.length))

/**
 * Kriptografik rastgele şifre (16 karakter ≈ 92 bit). Panelin şifre kuralını (8–72 karakter, en az bir
 * harf ve bir rakam) her zaman sağlar: rastgele iki ayrı konuma garanti harf ve rakam yerleştirilir.
 */
export function generatePassword(length = 16): string {
  if (!Number.isInteger(length) || length < 8 || length > 72) {
    throw new RangeError('Şifre uzunluğu 8–72 arasında olmalı')
  }
  const chars = Array.from({ length }, () => pick(ALPHABET))
  const letterAt = randomInt(length)
  const digitOffset = randomInt(length - 1)
  const digitAt = digitOffset < letterAt ? digitOffset : digitOffset + 1
  chars[letterAt] = pick(LETTERS)
  chars[digitAt] = pick(DIGITS)
  return chars.join('')
}
