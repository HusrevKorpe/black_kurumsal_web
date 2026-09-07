import { SENTRY_ENABLED } from '@/lib/sentry/client'
import { initSentryLazily } from '@/lib/sentry/lazy-init'

// Tarayıcıda her sayfada, hydration'dan önce çalışır. Sentry burada başlatılmaz: SDK ilk pakete
// girmesin ve LCP görselinin boyanmasını geciktirmesin diye sayfa yüklendikten sonra boşta
// yüklenir (lib/sentry/lazy-init.ts). DSN yoksa hiçbir dinleyici kurulmaz, hiçbir şey indirilmez.
// Yalnızca hata izleme yapıldığından Next'in `onRouterTransitionStart` kancası dışa aktarılmaz.
if (SENTRY_ENABLED) initSentryLazily()
