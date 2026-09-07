import { afterEach, describe, expect, it, vi } from 'vitest'

const DSN = 'https://key@o1.ingest.sentry.io/1'
const sentryMock = { init: vi.fn(), captureException: vi.fn() }

/** Modül DSN'yi import anında okur; her senaryo taze bir modül örneğiyle çalışır. */
async function loadModule(dsn: string, sdkFactory?: () => typeof sentryMock) {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', dsn)
  vi.doMock('@sentry/nextjs', () => sentryMock)
  // Köprü modülü (./sdk) gerçek kalır; indirme hatası senaryosu onu doğrudan taklit eder.
  if (sdkFactory) vi.doMock('./sdk', sdkFactory)
  return import('./client')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.doUnmock('@sentry/nextjs')
  vi.doUnmock('./sdk')
  vi.clearAllMocks()
})

describe('loadSentry', () => {
  it('DSN yoksa hiçbir şey indirmez, başlatmaz ve captureException sessizce geçer', async () => {
    const mod = await loadModule('')
    expect(mod.SENTRY_ENABLED).toBe(false)
    await expect(mod.loadSentry()).resolves.toBeNull()
    await mod.captureException(new Error('x'))
    expect(sentryMock.init).not.toHaveBeenCalled()
    expect(sentryMock.captureException).not.toHaveBeenCalled()
  })

  it('boşluklu DSN de kapalı sayılır', async () => {
    const mod = await loadModule('   ')
    expect(mod.SENTRY_ENABLED).toBe(false)
    await expect(mod.loadSentry()).resolves.toBeNull()
  })

  it('DSN varsa SDK bir kez başlatılır ve eşzamanlı çağrılar aynı örneği paylaşır', async () => {
    const mod = await loadModule(DSN)
    expect(mod.SENTRY_ENABLED).toBe(true)
    const [first, second] = await Promise.all([mod.loadSentry(), mod.loadSentry()])
    expect(first?.init).toBe(sentryMock.init)
    expect(second).toBe(first)
    expect(sentryMock.init).toHaveBeenCalledTimes(1)
    expect(sentryMock.init).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, dsn: DSN, sendDefaultPii: false }),
    )
  })

  it('captureException hatayı başlatılmış SDK’ya iletir', async () => {
    const mod = await loadModule(DSN)
    const error = new Error('patladı')
    await mod.captureException(error)
    expect(sentryMock.init).toHaveBeenCalledTimes(1)
    expect(sentryMock.captureException).toHaveBeenCalledWith(error)
  })

  it('SDK indirilemezse null döner, unhandled rejection üretmez ve sonraki çağrı yeniden dener', async () => {
    let failing = true
    const mod = await loadModule(DSN, () => {
      if (failing) throw new Error('ağ yok')
      return sentryMock
    })
    await expect(mod.loadSentry()).resolves.toBeNull()
    expect(sentryMock.init).not.toHaveBeenCalled()
    failing = false
    expect((await mod.loadSentry())?.init).toBe(sentryMock.init)
    expect(sentryMock.init).toHaveBeenCalledTimes(1)
  })
})
