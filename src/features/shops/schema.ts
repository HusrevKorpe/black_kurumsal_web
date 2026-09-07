import { z } from 'zod'
import { ShopType } from '@/generated/prisma/enums'
import {
  optionalPhone,
  optionalText,
  optionalUrl,
  slugSchema,
  sortOrderSchema,
} from '@/lib/validation/common'

export const featureSchema = z
  .string()
  .trim()
  .min(1, 'Boş özellik olamaz')
  .max(40, 'En fazla 40 karakter')

/** Patronun düzenleyebildiği tam form. */
export const shopFormSchema = z.object({
  name: z.string().trim().min(2, 'En az 2 karakter').max(80, 'En fazla 80 karakter'),
  slug: slugSchema,
  type: z.enum(ShopType, { error: 'Dükkan türü seçin' }),
  locationId: z.string().min(1).nullable(),
  description: optionalText(2000),
  address: optionalText(200),
  mapUrl: optionalUrl,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  instagramUrl: optionalUrl,
  features: z.array(featureSchema).max(12, 'En fazla 12 özellik'),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
  isActive: z.boolean(),
  sortOrder: sortOrderSchema,
})
export type ShopFormInput = z.infer<typeof shopFormSchema>

/** Dükkan sorumlusunun değiştirebildiği alt küme: yapı (slug, tür, mekan, aktiflik, sıra) patrondadır. */
export const OWNER_ONLY_SHOP_FIELDS = [
  'slug',
  'type',
  'locationId',
  'isActive',
  'sortOrder',
] as const
export const managerShopFormSchema = shopFormSchema.omit({
  slug: true,
  type: true,
  locationId: true,
  isActive: true,
  sortOrder: true,
})
export type ManagerShopFormInput = z.infer<typeof managerShopFormSchema>

export const updateShopSchema = z.object({ id: z.string().min(1), data: z.unknown() })
