import { z } from 'zod'

export type FieldErrors = Record<string, string[] | undefined>

export type ActionResult<T = null> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: FieldErrors }

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return { ok: false, error, fieldErrors }
}

/** Zod hatasını alan bazlı mesajlara çevirir. */
export function fromZodError(error: z.ZodError): ActionResult<never> {
  const flat = z.flattenError(error)
  const fieldErrors: FieldErrors = {}
  const entries = Object.entries(flat.fieldErrors as Record<string, string[] | undefined>)
  for (const [key, messages] of entries) {
    if (messages && messages.length > 0) fieldErrors[key] = messages
  }
  const first = Object.values(fieldErrors)[0]?.[0] ?? flat.formErrors[0] ?? 'Girdi doğrulanamadı.'
  return { ok: false, error: first, fieldErrors }
}
