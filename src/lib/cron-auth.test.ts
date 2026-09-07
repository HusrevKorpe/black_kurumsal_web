import { describe, expect, it } from 'vitest'
import { isCronRequestAuthorized } from './cron-auth'

function requestWith(authorization?: string) {
  return new Request('http://localhost/api/cron/x', {
    headers: authorization ? { authorization } : {},
  })
}

describe('isCronRequestAuthorized', () => {
  it('gizli anahtar tanımlı değilse hiçbir istek geçmez', () => {
    expect(isCronRequestAuthorized(requestWith('Bearer abc'), undefined)).toBe(false)
    expect(isCronRequestAuthorized(requestWith('Bearer '), '')).toBe(false)
  })

  it('doğru Bearer anahtarı geçer', () => {
    expect(isCronRequestAuthorized(requestWith('Bearer gizli-anahtar'), 'gizli-anahtar')).toBe(true)
  })

  it('yanlış, eksik ya da farklı biçimde anahtar reddedilir', () => {
    expect(isCronRequestAuthorized(requestWith('Bearer yanlis'), 'gizli-anahtar')).toBe(false)
    expect(isCronRequestAuthorized(requestWith('gizli-anahtar'), 'gizli-anahtar')).toBe(false)
    expect(isCronRequestAuthorized(requestWith(), 'gizli-anahtar')).toBe(false)
    expect(isCronRequestAuthorized(requestWith('Bearer gizli-anahta'), 'gizli-anahtar')).toBe(false)
  })
})
