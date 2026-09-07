// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = { captureException: vi.fn() }
const loadSentry = vi.fn<() => Promise<typeof sdk | null>>()

vi.mock('./client', () => ({ loadSentry: () => loadSentry() }))

/** Modülün tamponu modül düzeyinde durum; her test taze örnekle başlar. */
async function freshInit() {
  vi.resetModules()
  return (await import('./lazy-init')).initSentryLazily
}

/** Çözülmüş sözün `.then` zincirini işletir. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function throwError(message: string): Error {
  const error = new Error(message)
  window.dispatchEvent(new ErrorEvent('error', { error, message }))
  return error
}

function rejectPromise(reason: unknown): void {
  // jsdom PromiseRejectionEvent kurucusunu sunmaz; dinleyici yalnızca `reason` okur.
  window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason }))
}

let readyState: DocumentReadyState = 'complete'

// Vitest'in jsdom ortamı, window'da kullanıcı `error` dinleyicisi yokken gönderilen hata
// olaylarını yakalanmamış istisna sayar; test süresince pasif bir dinleyici tutulur.
const passive = (): void => {}

beforeEach(() => {
  window.addEventListener('error', passive)
  loadSentry.mockResolvedValue(sdk)
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => readyState })
  // Boşta çağrı testte hemen koşar; zamanlama ayrı testte doğrulanır.
  window.requestIdleCallback = (callback) => {
    callback({ didTimeout: false, timeRemaining: () => 50 })
    return 1
  }
})

afterEach(() => {
  window.removeEventListener('error', passive)
  readyState = 'complete'
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('initSentryLazily', () => {
  it('SDK açılmadan önceki hataları ve reddedilen sözleri sırayla iletir', async () => {
    const init = await freshInit()
    init()
    const early = throwError('erken')
    rejectPromise('sebep')
    expect(sdk.captureException).not.toHaveBeenCalled()

    await flush()
    expect(loadSentry).toHaveBeenCalledTimes(1)
    expect(sdk.captureException.mock.calls).toEqual([[early], ['sebep']])
  })

  it('SDK açıldıktan sonra tampon dinleyicileri kalkar; hatalar iki kez bildirilmez', async () => {
    const init = await freshInit()
    init()
    await flush()
    throwError('geç')
    await flush()
    expect(sdk.captureException).not.toHaveBeenCalled()
  })

  it('sayfa hâlâ yükleniyorsa SDK ancak load olayından sonra istenir', async () => {
    readyState = 'loading'
    const init = await freshInit()
    init()
    const early = throwError('yüklenirken')
    await flush()
    expect(loadSentry).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('load'))
    await flush()
    expect(loadSentry).toHaveBeenCalledTimes(1)
    expect(sdk.captureException).toHaveBeenCalledWith(early)
  })

  it('SDK yüklenemezse (null) tamponu atar ve dinleyicileri yine kaldırır', async () => {
    loadSentry.mockResolvedValue(null)
    const init = await freshInit()
    init()
    throwError('kayıp')
    await flush()
    throwError('sonraki')
    await flush()
    expect(sdk.captureException).not.toHaveBeenCalled()
  })

  it('tampon en fazla 20 kayıt tutar', async () => {
    const init = await freshInit()
    init()
    for (let i = 0; i < 25; i++) throwError(`hata ${i}`)
    await flush()
    expect(sdk.captureException).toHaveBeenCalledTimes(20)
    expect(sdk.captureException.mock.calls[0]?.[0]).toMatchObject({ message: 'hata 0' })
  })
})
