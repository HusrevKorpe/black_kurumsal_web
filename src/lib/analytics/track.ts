import { whenIdleAfterLoad } from '@/lib/browser/idle'
import { eventSignature, REPEAT_WINDOW_MS } from './repeat'

const ENDPOINT = '/api/olay'
/** Panel ve teknik yollar sayılmaz; sunucu da ayrıca eler. */
const IGNORED = /^\/(admin|api|monitoring|_next)(\/|$)/

interface TrackPayload {
  type: string
  path: string
  target?: string
  campaignId?: string
  referrer?: string
}

/** Gönderilen olayın imzası → gönderim anı. Tekrarlar bu listeye bakılarak elenir. */
const lastSent = new Map<string, number>()

/**
 * Aynı olay pencere içinde tekrar mı ediliyor? Sabırsız ziyaretçinin arka arkaya bastığı
 * düğme için istek hiç açılmaz — yavaş bağlantıda gereksiz istek de birikmez. Sayfa
 * yenilenince bu bellek sıfırlanır; asıl güvence sunucudaki eştir (features/analytics/dedupe.ts).
 */
function isRepeat(payload: TrackPayload): boolean {
  const now = Date.now()
  const key = eventSignature(payload)
  const previous = lastSent.get(key)
  if (previous !== undefined && now - previous < REPEAT_WINDOW_MS) return true
  // Uzun oturumda liste büyümesin: süresi dolmuş kayıtlar atılır.
  if (lastSent.size > 50) {
    for (const [old, at] of lastSent) {
      if (now - at >= REPEAT_WINDOW_MS) lastSent.delete(old)
    }
  }
  lastSent.set(key, now)
  return false
}

/**
 * Olayı arka planda bırakır. `sendBeacon` sayfa kapanırken/başka sayfaya geçerken bile iletir
 * ve ana iş parçacığını bekletmez; yoksa `keepalive` ile fetch'e düşülür. Hata yutulur:
 * sayaç hiçbir koşulda sayfayı bozmaz.
 */
function send(payload: TrackPayload): void {
  if (isRepeat(payload)) return
  try {
    const body = JSON.stringify(payload)
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    })
  } catch {
    // yok sayılır
  }
}

function trackPageView(path: string): void {
  if (IGNORED.test(path)) return
  send({ type: 'view', path, referrer: document.referrer || undefined })
}

/**
 * Tek bir yakalama aşamalı dinleyici bütün tıklamaları toplar: `data-track` taşıyan bir
 * öğenin içinde tıklandıysa olay gider. Böylece hiçbir bağlantı istemci bileşenine
 * dönüşmez, açık sitenin JS paketi büyümez.
 */
function onClick(event: MouseEvent): void {
  const start = event.target
  if (!(start instanceof Element)) return
  const element = start.closest('[data-track]')
  if (!element) return
  const type = element.getAttribute('data-track')
  if (!type || IGNORED.test(location.pathname)) return

  // Yalnızca kendi sitemize giden bağlantının yolu hedef sayılır: wa.me / tel: bağlantısında
  // hedef yoktur, olay bulunulan sayfanın dükkanına yazılır.
  const anchor = element instanceof HTMLAnchorElement && element.origin === location.origin
  send({
    type,
    path: location.pathname,
    target: anchor ? (element as HTMLAnchorElement).pathname : undefined,
    campaignId: element.getAttribute('data-track-campaign') ?? undefined,
  })
}

/** Sayfa yüklendiğinde bir kez çağrılır (instrumentation-client). */
export function initAnalytics(): void {
  document.addEventListener('click', onClick, { capture: true, passive: true })
  // İlk görüntüleme LCP ile yarışmasın: sayfa yüklenip ana iş parçacığı boşalınca gönderilir.
  whenIdleAfterLoad(() => trackPageView(location.pathname))
}

/** İstemci tarafı gezinme (Link tıklaması, geri/ileri) yeni sayfa görüntülemesidir. */
export function trackNavigation(url: string): void {
  try {
    trackPageView(new URL(url, location.href).pathname)
  } catch {
    // yok sayılır
  }
}
