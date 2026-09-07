import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { Prisma } from '@/generated/prisma/client'
import { AuthorizationError } from '@/lib/auth/authorize'
import { tr } from '@/lib/i18n/tr'
import { fail, type ActionResult } from './result'

/**
 * Server action gövdesini sarar: yetki hatası, benzersizlik çakışması ve beklenmeyen hataları
 * kullanıcıya okunur mesaja çevirir. Hiçbir server action yakalanmamış hata fırlatmaz; bu yüzden
 * beklenmeyen hatalar burada Sentry'ye bildirilir (Next'in onRequestError'ı onları göremez).
 */
export async function runAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof AuthorizationError) return fail(tr.errors.unauthorized)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return fail(tr.errors.duplicate)
      if (error.code === 'P2025') return fail(tr.errors.notFound)
      if (error.code === 'P2003') return fail(tr.errors.inUse)
    }
    console.error('[action]', error)
    Sentry.captureException(error)
    return fail(tr.errors.unexpected)
  }
}
