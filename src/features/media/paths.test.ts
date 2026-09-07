import { describe, expect, it } from 'vitest'
import { buildMediaPath, isAllowedImageType, parseMediaPath } from './paths'

const uuid = '018f3f2e-6a3b-7c1d-9e2f-1a2b3c4d5e6f'

describe('media paths', () => {
  it('yolu kurar ve geri okur', () => {
    const path = buildMediaPath('shop', 'abc-123', 'image/webp', uuid)
    expect(path).toBe(`shop/abc-123/${uuid}.webp`)
    expect(parseMediaPath(path)).toEqual({ kind: 'shop', ownerId: 'abc-123' })
  })

  it('bozuk veya sahte yolları reddeder', () => {
    expect(parseMediaPath('shop/../x.webp')).toBeNull()
    expect(parseMediaPath(`unknown/abc/${uuid}.webp`)).toBeNull()
    expect(parseMediaPath(`shop/abc/${uuid}.exe`)).toBeNull()
    expect(parseMediaPath(`shop/abc/not-a-uuid.webp`)).toBeNull()
  })

  it('izinli mime tiplerini tanır', () => {
    expect(isAllowedImageType('image/webp')).toBe(true)
    expect(isAllowedImageType('image/gif')).toBe(false)
    expect(isAllowedImageType('text/html')).toBe(false)
  })
})
