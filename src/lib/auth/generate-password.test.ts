import { describe, expect, it } from 'vitest'
import { generatePassword } from './generate-password'

const SAFE_ALPHABET = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]+$/

function expectMeetsPolicy(password: string): void {
  expect(password).toMatch(/[a-z]/)
  expect(password).toMatch(/[A-Z]/)
  expect(password).toMatch(/\d/)
  expect(password).toMatch(SAFE_ALPHABET)
}

describe('generatePassword', () => {
  it('varsayılan 16 karakter; her üretimde küçük harf, büyük harf, rakam ve güvenli alfabe', () => {
    for (let i = 0; i < 300; i++) {
      const password = generatePassword()
      expect(password).toHaveLength(16)
      expectMeetsPolicy(password)
    }
  })

  it('en kısa uzunlukta da kuralı sağlar: üç garanti karakter birbirini ezmez', () => {
    for (let i = 0; i < 300; i++) {
      const shortest = generatePassword(12)
      expect(shortest).toHaveLength(12)
      expectMeetsPolicy(shortest)
    }
    expect(generatePassword(72)).toHaveLength(72)
  })

  it('iki üretim birbirinden farklıdır', () => {
    expect(generatePassword()).not.toBe(generatePassword())
  })

  it('12–72 dışını ve tam sayı olmayanı reddeder', () => {
    expect(() => generatePassword(11)).toThrow(RangeError)
    expect(() => generatePassword(73)).toThrow(RangeError)
    expect(() => generatePassword(10.5)).toThrow(RangeError)
  })
})
