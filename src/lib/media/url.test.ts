import { describe, expect, it, vi } from 'vitest'
import { mediaPublicUrl } from './url'

vi.mock('@/lib/env', () => ({
  publicEnv: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321/',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  },
}))

describe('mediaPublicUrl', () => {
  it('bucket ve yolu public storage adresine çevirir', () => {
    expect(mediaPublicUrl({ bucket: 'media', path: 'seed/shops/a-cover.webp' })).toBe(
      'http://127.0.0.1:54321/storage/v1/object/public/media/seed/shops/a-cover.webp',
    )
  })

  it('özel karakterleri kodlar, eğik çizgileri korur', () => {
    expect(mediaPublicUrl({ bucket: 'media', path: 'shops/çarşı resim 1.webp' })).toBe(
      'http://127.0.0.1:54321/storage/v1/object/public/media/shops/%C3%A7ar%C5%9F%C4%B1%20resim%201.webp',
    )
  })
})
