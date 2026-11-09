/** Dükkanların bulunduğu şehir: arama başlıkları, Google işletme verisi ve alt bilgide kullanılır. */
export const SITE_CITY = 'Isparta'

/** Ana sayfa arama başlığı ve açıklaması (Google'da görünen). Dükkan sayfaları `%s | Black Isparta` olur. */
export const SITE_TITLE = `Black ${SITE_CITY} | PlayStation Kafe, Tost ve Apart`
export const SITE_TITLE_TEMPLATE = `%s | Black ${SITE_CITY}`
export const SITE_DESCRIPTION = `${SITE_CITY}'da Black dükkanları: PlayStation, espor, tost, Black Garden, Lulu Kafe ve Lavinya Apart. Fiyat listeleri, çalışma saatleri, telefon ve WhatsApp.`

/** Panelden SEO açıklaması ya da tanıtım yazısı girilmemiş dükkan/mekan sayfası için. */
export function pageDescription(name: string, kind: string): string {
  return `${name}, ${SITE_CITY} · ${kind}. Fiyat listesi, çalışma saatleri, telefon ve WhatsApp.`
}

/**
 * Fotoğrafı olmayan sayfanın paylaşım görseli (WhatsApp, Instagram önizlemesi): siyah zeminde altın
 * taç ve marka. Yeniden üretmek için `node scripts/og-image.mjs public/og.png`.
 */
export const DEFAULT_OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: `Black ${SITE_CITY}`,
} as const
