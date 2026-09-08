import { afterEach, describe, expect, it } from 'vitest'
import robots, { isIndexable } from './robots'

const original = process.env.VERCEL_ENV

afterEach(() => {
  if (original === undefined) delete process.env.VERCEL_ENV
  else process.env.VERCEL_ENV = original
})

describe('robots', () => {
  it('yalnızca canlıda ve Vercel dışında (yerel, CI) indekslenir', () => {
    expect(isIndexable(undefined)).toBe(true)
    expect(isIndexable('production')).toBe(true)
    expect(isIndexable('preview')).toBe(false)
    expect(isIndexable('development')).toBe(false)
  })

  it('canlıda paneli kapatır, site haritasını verir', () => {
    process.env.VERCEL_ENV = 'production'
    const result = robots()
    expect(result.rules).toEqual([{ userAgent: '*', allow: '/', disallow: ['/admin'] }])
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
  })

  it('staging (preview) tamamen kapalıdır ve site haritası vermez', () => {
    process.env.VERCEL_ENV = 'preview'
    const result = robots()
    expect(result.rules).toEqual([{ userAgent: '*', disallow: '/' }])
    expect(result.sitemap).toBeUndefined()
  })
})
