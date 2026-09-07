import { describe, expect, it } from 'vitest'
import type { ShopStatRow } from './queries'
import { DEFAULT_SHOP_SORT, parseShopSort, sortShopRows } from './view'

function row(name: string, views: number, whatsapp: number, call: number): ShopStatRow {
  return {
    id: name,
    name,
    slug: name,
    isActive: true,
    isTrashed: false,
    totals: {
      PAGE_VIEW: views,
      CALL_CLICK: call,
      WHATSAPP_CLICK: whatsapp,
      DIRECTIONS_CLICK: 0,
      INSTAGRAM_CLICK: 0,
      SHOP_CARD_CLICK: 0,
      LOCATION_CARD_CLICK: 0,
      CAMPAIGN_CLICK: 0,
      GALLERY_OPEN: 0,
    },
    interactions: whatsapp + call,
  }
}

const rows = [row('Tost', 100, 2, 1), row('Kafe', 40, 9, 0), row('Apart', 60, 1, 8)]

describe('sıralama anahtarı', () => {
  it('tanımsız değerde varsayılana döner', () => {
    expect(parseShopSort(undefined)).toBe(DEFAULT_SHOP_SORT)
    expect(parseShopSort('fiyat')).toBe(DEFAULT_SHOP_SORT)
    expect(parseShopSort('whatsapp')).toBe('whatsapp')
  })
})

describe('dükkan sıralama', () => {
  it('WhatsApp sütununa göre çoktan aza', () => {
    expect(sortShopRows(rows, 'whatsapp').map((r) => r.name)).toEqual(['Kafe', 'Tost', 'Apart'])
  })

  it('görüntülenmeye göre', () => {
    expect(sortShopRows(rows, 'goruntulenme').map((r) => r.name)).toEqual(['Tost', 'Apart', 'Kafe'])
  })

  it('toplam ilgide eşitlik görüntülenmeyle çözülür', () => {
    // Kafe 9, Apart 9 ilgi; Apart daha çok görüntülendiği için üstte.
    expect(sortShopRows(rows, 'ilgi').map((r) => r.name)).toEqual(['Apart', 'Kafe', 'Tost'])
  })

  it('kaynağı değiştirmez', () => {
    const before = rows.map((r) => r.name)
    sortShopRows(rows, 'ara')
    expect(rows.map((r) => r.name)).toEqual(before)
  })
})
