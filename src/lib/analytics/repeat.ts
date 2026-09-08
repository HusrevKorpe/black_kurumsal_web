/**
 * Aynı olay bu süre içinde tekrarlanırsa bir kez sayılır. Yavaş bağlantıda sabırsızlanan
 * ziyaretçi WhatsApp düğmesine arka arkaya basar, sayfayı üst üste yeniler; patronun gördüğü
 * sayı bundan şişmesin diye tekrarlar elenir.
 *
 * Pencere iki yerde uygulanır:
 * - Tarayıcıda (`lib/analytics/track.ts`): tekrar için istek hiç gitmez.
 * - Sunucuda (`features/analytics/dedupe.ts`): sayfa yenilendiğinde ya da ikinci sekmede
 *   tarayıcının belleği sıfırlanır; asıl güvence buradadır.
 */
export const REPEAT_WINDOW_MS = 30_000

/** Pencerede kaç saniye olduğu panelde de yazar (i18n metni bu sayıdan üretilir). */
export const REPEAT_WINDOW_SECONDS = REPEAT_WINDOW_MS / 1000

interface SignatureInput {
  type: string
  path: string
  target?: string | null
  campaignId?: string | null
}

/**
 * "Aynı olay" ölçüsü: aynı tür, aynı sayfa, aynı hedef, aynı kampanya. Farklı dükkanın
 * WhatsApp'ı ya da aynı sayfadaki başka bir düğme ayrı sayılır; yalnızca birebir tekrar elenir.
 */
export function eventSignature(event: SignatureInput): string {
  return `${event.type}|${event.path}|${event.target ?? ''}|${event.campaignId ?? ''}`
}
