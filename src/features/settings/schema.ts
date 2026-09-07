import { z } from 'zod'
import { optionalPhone, optionalText, optionalUrl } from '@/lib/validation/common'

export const siteSettingsSchema = z.object({
  brandName: z.string().trim().min(1, 'Marka adı gerekli').max(40, 'En fazla 40 karakter'),
  heroTitle: z.string().trim().min(2, 'Başlık gerekli').max(120, 'En fazla 120 karakter'),
  heroSubtitle: optionalText(300),
  aboutText: optionalText(3000),
  contactPhone: optionalPhone,
  contactEmail: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.email({ error: 'Geçerli bir e-posta girin' }).nullable(),
  ),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  logoImageId: z.string().min(1).nullable(),
})
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>
