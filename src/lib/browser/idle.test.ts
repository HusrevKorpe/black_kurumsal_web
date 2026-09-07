// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { whenIdleAfterLoad } from './idle'

let readyState: DocumentReadyState = 'complete'

beforeEach(() => {
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => readyState })
})

afterEach(() => {
  readyState = 'complete'
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('whenIdleAfterLoad', () => {
  it('sayfa yüklüyse requestIdleCallback ile 3 sn zaman aşımı vererek planlar', () => {
    const ric = vi.fn<typeof window.requestIdleCallback>(() => 7)
    window.requestIdleCallback = ric
    const callback = vi.fn()
    whenIdleAfterLoad(callback)
    expect(ric).toHaveBeenCalledWith(callback, { timeout: 3000 })
  })

  it('iptal edilince planlanmış idle çağrısı geri alınır', () => {
    window.requestIdleCallback = () => 42
    const cancelIdle = vi.fn()
    window.cancelIdleCallback = cancelIdle
    const cancel = whenIdleAfterLoad(vi.fn())
    cancel()
    expect(cancelIdle).toHaveBeenCalledWith(42)
  })

  it('requestIdleCallback yoksa load sonrası 1 sn bekler; iptal zamanlayıcıyı temizler', () => {
    vi.useFakeTimers()
    // @ts-expect-error eski tarayıcı yolu: API yok.
    delete window.requestIdleCallback
    const callback = vi.fn()
    whenIdleAfterLoad(callback)
    vi.advanceTimersByTime(999)
    expect(callback).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledTimes(1)

    const cancelled = vi.fn()
    whenIdleAfterLoad(cancelled)()
    vi.advanceTimersByTime(5000)
    expect(cancelled).not.toHaveBeenCalled()
  })

  it('sayfa hâlâ yükleniyorsa load olayını bekler', () => {
    readyState = 'loading'
    window.requestIdleCallback = (cb) => {
      cb({ didTimeout: false, timeRemaining: () => 50 })
      return 1
    }
    const callback = vi.fn()
    whenIdleAfterLoad(callback)
    expect(callback).not.toHaveBeenCalled()
    window.dispatchEvent(new Event('load'))
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('load beklenirken iptal edilirse dinleyici kalkar', () => {
    readyState = 'loading'
    const callback = vi.fn()
    whenIdleAfterLoad(callback)()
    window.dispatchEvent(new Event('load'))
    expect(callback).not.toHaveBeenCalled()
  })
})
