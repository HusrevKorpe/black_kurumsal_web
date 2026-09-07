import { describe, expect, it } from 'vitest'
import { dateToLocalInput, localInputToIso } from './datetime'

describe('datetime-local dönüşümleri', () => {
  it('boş ve bozuk değerde null', () => {
    expect(localInputToIso('')).toBeNull()
    expect(localInputToIso('abc')).toBeNull()
  })

  it('gidiş-dönüş değeri korur', () => {
    const value = '2026-09-05T21:30'
    const iso = localInputToIso(value)
    expect(iso).not.toBeNull()
    expect(dateToLocalInput(new Date(iso as string))).toBe(value)
  })

  it('null tarih boş string', () => {
    expect(dateToLocalInput(null)).toBe('')
  })
})
