import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { AuthorizationError } from '@/lib/auth/authorize'
import { tr } from '@/lib/i18n/tr'
import { ok } from './result'
import { runAction } from './run'

const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureException: (error: unknown) => captureException(error),
}))

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('db', { code, clientVersion: 'test' })
}

describe('runAction', () => {
  beforeEach(() => {
    captureException.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('başarılı sonucu olduğu gibi döndürür', async () => {
    await expect(runAction(async () => ok({ id: 1 }))).resolves.toEqual({
      ok: true,
      data: { id: 1 },
    })
    expect(captureException).not.toHaveBeenCalled()
  })

  it('yetki hatasını okunur mesaja çevirir; Sentry’ye göndermez', async () => {
    const result = await runAction(async () => {
      throw new AuthorizationError()
    })
    expect(result).toEqual({ ok: false, error: tr.errors.unauthorized, fieldErrors: undefined })
    expect(captureException).not.toHaveBeenCalled()
  })

  it.each([
    ['P2002', tr.errors.duplicate],
    ['P2025', tr.errors.notFound],
    ['P2003', tr.errors.inUse],
  ])('bilinen Prisma hatası %s eşlenir', async (code, message) => {
    const result = await runAction(async () => {
      throw prismaError(code)
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe(message)
    expect(captureException).not.toHaveBeenCalled()
  })

  it('beklenmeyen hatayı Sentry’ye bildirir ve genel mesaj döner', async () => {
    const boom = new Error('boom')
    const result = await runAction(async () => {
      throw boom
    })
    expect(result).toEqual({ ok: false, error: tr.errors.unexpected, fieldErrors: undefined })
    expect(captureException).toHaveBeenCalledWith(boom)
    expect(console.error).toHaveBeenCalled()
  })
})
