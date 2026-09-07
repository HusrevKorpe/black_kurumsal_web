import { z } from 'zod'
import { HM_PATTERN } from '@/features/hours/time'
import { normalizeTrPhone } from '@/lib/utils/format'
import { isReservedSlug, isValidSlug } from '@/lib/utils/slugify'

/** Boş string'i null'a çevirir; formlardan gelen isteğe bağlı alanlar için. */
export function optionalText(max: number) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(max, `En fazla ${max} karakter`).nullable(),
  )
}

export const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.url({ error: 'Geçerli bir bağlantı girin (https://…)' }).max(500).nullable(),
)

export const optionalPhone = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z
    .string()
    .trim()
    .refine(
      (value) => normalizeTrPhone(value) !== null,
      'Geçerli bir telefon numarası girin (05xx xxx xx xx)',
    )
    .nullable(),
)

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidSlug, 'Slug yalnızca küçük harf, rakam ve tire içerebilir (2-80 karakter)')
  .refine((slug) => !isReservedSlug(slug), 'Bu adres sistem tarafından kullanılıyor')

export const hmSchema = z.string().regex(HM_PATTERN, 'Saat SS:DD biçiminde olmalı')

export const sortOrderSchema = z.int({ error: 'Tam sayı olmalı' }).min(0).max(9999)

export const idSchema = z.string().min(1, 'Kayıt seçin')
