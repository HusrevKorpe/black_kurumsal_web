import type { ShopStatRow } from './queries'

/** Panelde tablo başlıklarına tıklanınca adres çubuğuna yazılan değerler. */
export const SHOP_SORT_KEYS = ['ilgi', 'goruntulenme', 'whatsapp', 'ara'] as const
export type ShopSortKey = (typeof SHOP_SORT_KEYS)[number]
export const DEFAULT_SHOP_SORT: ShopSortKey = 'ilgi'

export function parseShopSort(value: string | string[] | undefined): ShopSortKey {
  const raw = Array.isArray(value) ? value[0] : value
  return (SHOP_SORT_KEYS as readonly string[]).includes(raw ?? '')
    ? (raw as ShopSortKey)
    : DEFAULT_SHOP_SORT
}

function sortValue(row: ShopStatRow, key: ShopSortKey): number {
  switch (key) {
    case 'goruntulenme':
      return row.totals.PAGE_VIEW
    case 'whatsapp':
      return row.totals.WHATSAPP_CLICK
    case 'ara':
      return row.totals.CALL_CLICK
    default:
      return row.interactions
  }
}

/** Büyükten küçüğe; eşitlikte görüntülenme, sonra ad (liste her yenilemede aynı sırada dursun). */
export function sortShopRows(rows: readonly ShopStatRow[], key: ShopSortKey): ShopStatRow[] {
  return [...rows].sort(
    (a, b) =>
      sortValue(b, key) - sortValue(a, key) ||
      b.totals.PAGE_VIEW - a.totals.PAGE_VIEW ||
      a.name.localeCompare(b.name, 'tr'),
  )
}
