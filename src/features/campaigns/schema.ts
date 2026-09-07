import { z } from 'zod'
import { CampaignScope } from '@/generated/prisma/enums'
import { idSchema, optionalText, optionalUrl, sortOrderSchema } from '@/lib/validation/common'

const optionalDate = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.date({ error: 'Geçerli bir tarih girin' }).nullable(),
)

export const campaignFormSchema = z
  .object({
    title: z.string().trim().min(2, 'En az 2 karakter').max(80, 'En fazla 80 karakter'),
    description: optionalText(500),
    imageId: idSchema.describe('Kampanya görseli zorunlu'),
    scope: z.enum(CampaignScope, { error: 'Kapsam seçin' }),
    shopId: z.string().min(1).nullable(),
    locationId: z.string().min(1).nullable(),
    ctaLabel: optionalText(40),
    ctaUrl: optionalUrl,
    startsAt: optionalDate,
    endsAt: optionalDate,
    isActive: z.boolean(),
    sortOrder: sortOrderSchema,
  })
  .refine((c) => (c.scope === 'SHOP' ? c.shopId !== null && c.locationId === null : true), {
    message: 'Dükkan kampanyası için dükkan seçin',
    path: ['shopId'],
  })
  .refine((c) => (c.scope === 'LOCATION' ? c.locationId !== null && c.shopId === null : true), {
    message: 'Mekan kampanyası için mekan seçin',
    path: ['locationId'],
  })
  .refine((c) => (c.scope === 'GLOBAL' ? c.shopId === null && c.locationId === null : true), {
    message: 'Genel kampanyada hedef seçilmez',
    path: ['scope'],
  })
  .refine((c) => !c.startsAt || !c.endsAt || c.endsAt.getTime() >= c.startsAt.getTime(), {
    message: 'Bitiş, başlangıçtan önce olamaz',
    path: ['endsAt'],
  })
export type CampaignFormInput = z.infer<typeof campaignFormSchema>
