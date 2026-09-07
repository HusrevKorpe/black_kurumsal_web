import { whenIdleAfterLoad } from '@/lib/browser/idle'

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

/**
 * Olayı arka planda bırakır. `sendBeacon` sayfa kapanırken/başka sayfaya geçerken bile iletir
 * ve ana iş parçacığını bekletmez; yoksa `keepalive` ile fetch'e düşülür. Hata yutulur:
 * sayaç hiçbir koşulda sayfayı bozmaz.
 */
function send(payload: TrackPayload): void {
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
