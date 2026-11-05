import { describe, expect, it } from 'vitest'
import { desktopBand } from './cover-focus-editor'

describe('desktopBand', () => {
  it('dik fotoğrafta ince bir bant görünür, odak bandı kaydırır', () => {
    // 3:4 fotoğraf, 16:5 şerit: yüksekliğin %23,4'ü görünür.
    expect(desktopBand(1536, 2048, 0)).toEqual({ top: 0, height: 23.4375 })
    expect(desktopBand(1536, 2048, 100).top).toBeCloseTo(76.5625)
    expect(desktopBand(1536, 2048, 50).top).toBeCloseTo(38.28125)
  })

  it('şeritten yatık fotoğrafın tamamı görünür', () => {
    expect(desktopBand(4000, 1000, 70)).toEqual({ top: 0, height: 100 })
  })
})
