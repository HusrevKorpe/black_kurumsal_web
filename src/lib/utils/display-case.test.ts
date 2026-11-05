import { describe, expect, it } from 'vitest'
import { splitDisplayName } from './display-case'

describe('splitDisplayName', () => {
  it('ortası büyük harfli marka adını ayırır', () => {
    expect(splitDisplayName('Black PlayStation Çarşı')).toEqual([
      { text: 'Black ', foreign: false },
      { text: 'PlayStation ', foreign: true },
      { text: 'Çarşı', foreign: false },
    ])
  })

  it('Türkçe adı tek parça bırakır', () => {
    expect(splitDisplayName('Tost Evi')).toEqual([{ text: 'Tost Evi', foreign: false }])
  })

  it('bilinen İngilizce kelimeyi büyük küçük harften bağımsız tanır', () => {
    expect(splitDisplayName('VIP Salon')).toEqual([
      { text: 'VIP ', foreign: true },
      { text: 'Salon', foreign: false },
    ])
    expect(splitDisplayName('Playstation 5')).toEqual([
      { text: 'Playstation ', foreign: true },
      { text: '5', foreign: false },
    ])
  })

  it('yan yana yabancı kelimeleri birleştirir', () => {
    expect(splitDisplayName('PlayStation Gaming')).toEqual([
      { text: 'PlayStation Gaming', foreign: true },
    ])
  })
})
