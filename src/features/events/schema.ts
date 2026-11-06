import { z } from 'zod'
import { optionalText } from '@/lib/validation/common'

const optionalDate = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.date({ error: 'Geçerli bir tarih girin' }).nullable(),
)

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(2, 'En az 2 karakter').max(80, 'En fazla 80 karakter'),
    description: optionalText(300),
    /** null: tüm dükkanlar. */
    shopId: z.string().min(1).nullable(),
    startsAt: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce.date({ error: 'Başlangıç tarihi ve saati girin' }),
    ),
    endsAt: optionalDate,
    isActive: z.boolean(),
  })
  .refine((e) => !e.endsAt || e.endsAt.getTime() >= e.startsAt.getTime(), {
    message: 'Bitiş, başlangıçtan önce olamaz',
    path: ['endsAt'],
  })
export type EventFormInput = z.infer<typeof eventFormSchema>
