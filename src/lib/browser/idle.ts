/** `requestIdleCallback` bu kadar bekledikten sonra boşluk olmasa da çalışır. */
const IDLE_TIMEOUT_MS = 3000
/** `requestIdleCallback` olmayan tarayıcılar için `load` sonrası gecikme. */
const FALLBACK_DELAY_MS = 1000

/**
 * Sayfa `load` olayını geçtikten sonra ana iş parçacığı boşaldığında çalıştırır. LCP'yi ve
 * hydration'ı geciktirmemesi gereken ikincil işler (hata izleme SDK'sı, menü kodu) buradan
 * planlanır. Dönen fonksiyon planlanmış çağrıyı iptal eder (bileşen sökülürse).
 */
export function whenIdleAfterLoad(callback: () => void): () => void {
  let cancel: () => void

  const idle = (): void => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS })
      cancel = () => window.cancelIdleCallback(id)
    } else {
      const id = window.setTimeout(callback, FALLBACK_DELAY_MS)
      cancel = () => window.clearTimeout(id)
    }
  }

  if (document.readyState === 'complete') {
    idle()
  } else {
    window.addEventListener('load', idle, { once: true })
    cancel = () => window.removeEventListener('load', idle)
  }

  return () => cancel()
}
