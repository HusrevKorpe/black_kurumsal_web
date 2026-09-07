import { describe, expect, it } from 'vitest'
import { generatePassword } from './generate-password'

const SAFE_ALPHABET = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]+$/

describe('generatePassword', () => {
  it('varsayılan 16 karakter; her üretimde en az bir harf ve bir rakam, güvenli alfabe', () => {
    for (let i = 0; i < 300; i++) {
      const password = generatePassword()
      expect(password).toHaveLength(16)
      expect(password).toMatch(/[A-Za-z]/)
      expect(password).toMatch(/\d/)
      expect(password).toMatch(SAFE_ALPHABET)
    }
  })

  it('sınır uzunluklarda da kuralı sağlar', () => {
    for (let i = 0; i < 100; i++) {
      const shortest = generatePassword(8)
      expect(shortest).toHaveLength(8)
      expect(shortest).toMatch(/[A-Za-z]/)
      expect(shortest).toMatch(/\d/)
    }
    expect(generatePassword(72)).toHaveLength(72)
  })

  it('iki üretim birbirinden farklıdır', () => {
    expect(generatePassword()).not.toBe(generatePassword())
  })

  it('8–72 dışını ve tam sayı olmayanı reddeder', () => {
    expect(() => generatePassword(7)).toThrow(RangeError)
    expect(() => generatePassword(73)).toThrow(RangeError)
    expect(() => generatePassword(10.5)).toThrow(RangeError)
  })
})
