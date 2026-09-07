import { describe, expect, it } from 'vitest'
import { sanitizePath, trackEventSchema } from './schema'

describe('yol temizleme', () => {
  it('sorgu dizesini ve çapayı atar', () => {
    expect(sanitizePath('/black-tost?utm_source=ig')).toBe('/black-tost')
    expect(sanitizePath('/#dukkanlar')).toBe('/')
  })

  it('sondaki eğik çizgiyi atar, kök yolu korur', () => {
    expect(sanitizePath('/mekan/garden/')).toBe('/mekan/garden')
    expect(sanitizePath('/')).toBe('/')
  })

  it('panel ve teknik yolları saymaz', () => {
    expect(sanitizePath('/admin')).toBeNull()
    expect(sanitizePath('/admin/dukkanlar')).toBeNull()
    expect(sanitizePath('/api/olay')).toBeNull()
    expect(sanitizePath('/_next/static/chunk.js')).toBeNull()
  })

  it('yol olmayanı reddeder', () => {
    expect(sanitizePath('https://baska-site.com/x')).toBeNull()
    expect(sanitizePath('//baska-site.com')).toBeNull()
    expect(sanitizePath(`/${'a'.repeat(300)}`)).toBeNull()
    expect(sanitizePath('/<script>')).toBeNull()
  })
})

describe('olay gövdesi', () => {
  it('bilinen türü ve yolu kabul eder', () => {
    const result = trackEventSchema.safeParse({ type: 'whatsapp', path: '/black-tost' })
    expect(result.success).toBe(true)
    expect(result.data?.path).toBe('/black-tost')
  })

  it('bilinmeyen türü reddeder', () => {
    expect(trackEventSchema.safeParse({ type: 'hack', path: '/' }).success).toBe(false)
  })

  it('geçersiz yol null olur, olay yazılmaz', () => {
    const result = trackEventSchema.safeParse({ type: 'view', path: '/admin' })
    expect(result.success).toBe(true)
    expect(result.data?.path).toBeNull()
  })

  it('kampanya kimliği uuid değilse reddeder', () => {
    const result = trackEventSchema.safeParse({ type: 'campaign', path: '/', campaignId: '12' })
    expect(result.success).toBe(false)
  })
})
