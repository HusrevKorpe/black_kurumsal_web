import { describe, expect, it } from 'vitest'
import { buildSentryOptions } from './options'

describe('buildSentryOptions', () => {
  it('DSN yoksa SDK kapalıdır ve ortam development olur', () => {
    const options = buildSentryOptions({
      dsn: undefined,
      environment: undefined,
      release: undefined,
    })
    expect(options.enabled).toBe(false)
    expect(options.dsn).toBeUndefined()
    expect(options.environment).toBe('development')
    expect(options.release).toBeUndefined()
  })

  it('boş ya da boşluklu DSN de kapalı sayılır', () => {
    expect(buildSentryOptions({ dsn: '   ', environment: 'production', release: '' }).enabled).toBe(
      false,
    )
  })

  it('DSN varsa SDK açılır; ortam ve sürüm olduğu gibi geçer', () => {
    const dsn = 'https://key@o1.ingest.sentry.io/1'
    const prod = buildSentryOptions({ dsn, environment: 'production', release: 'abc' })
    expect(prod).toMatchObject({ enabled: true, dsn, environment: 'production', release: 'abc' })
    const preview = buildSentryOptions({ dsn, environment: 'preview', release: undefined })
    expect(preview.environment).toBe('preview')
  })

  it('kişisel veri gönderimi her zaman kapalıdır', () => {
    const dsn = 'https://key@o1.ingest.sentry.io/1'
    expect(
      buildSentryOptions({ dsn, environment: 'production', release: undefined }).sendDefaultPii,
    ).toBe(false)
  })
})
