/**
 * Tadilattaki dükkanlar (2026-11-06: Lulu Kafe). Sayfası fiyat listesi yerine "Yakında açılıyor"
 * sahnesini, ağaçtaki ve mekândaki kartı açık/kapalı yerine "Tadilatta" etiketini gösterir.
 * Dükkan açılınca slug buradan silinir; başka bir şeye dokunmak gerekmez.
 */
const RENOVATION_SHOP_SLUGS: ReadonlySet<string> = new Set(['lulu-kafe'])

export function isUnderRenovation(slug: string): boolean {
  return RENOVATION_SHOP_SLUGS.has(slug)
}
