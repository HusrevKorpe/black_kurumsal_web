import { initAnalytics, trackNavigation } from '@/lib/analytics/track'
import { SENTRY_ENABLED } from '@/lib/sentry/client'
import { initSentryLazily } from '@/lib/sentry/lazy-init'

// Tarayıcıda her sayfada, hydration'dan önce çalışır. Sentry burada başlatılmaz: SDK ilk pakete
// girmesin ve LCP görselinin boyanmasını geciktirmesin diye sayfa yüklendikten sonra boşta
// yüklenir (lib/sentry/lazy-init.ts). DSN yoksa hiçbir dinleyici kurulmaz, hiçbir şey indirilmez.
if (SENTRY_ENABLED) initSentryLazily()

// Ziyaret sayacı: tek tıklama dinleyicisi + ilk sayfa görüntülemesi. Kendi kodumuz (~1 KB),
// dışarıdan hiçbir betik yüklenmez, ölçüm sunucusu kendi veritabanımız.
initAnalytics()

/** App Router gezinmeleri tam sayfa yüklemesi yapmaz; sayfa görüntülemesi buradan sayılır. */
export function onRouterTransitionStart(url: string): void {
  trackNavigation(url)
}
