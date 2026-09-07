import { z } from 'zod'
import { idSchema, optionalText } from '@/lib/validation/common'

export const priceCategorySchema = z.object({
  shopId: idSchema,
  name: z.string().trim().min(1, 'Kategori adı gerekli').max(60, 'En fazla 60 karakter'),
  description: optionalText(200),
  isActive: z.boolean().default(true),
})
export type PriceCategoryInput = z.infer<typeof priceCategorySchema>

const priceValue = z.preprocess(
  (value) =>
    value === '' || value === undefined
      ? null
      : typeof value === 'string'
        ? Number(value.replace(',', '.'))
        : value,
  z
    .number({ error: 'Fiyat sayı olmalı' })
    .min(0, 'Fiyat negatif olamaz')
    .max(999_999, 'Fiyat çok büyük')
    .nullable(),
)

export const priceItemSchema = z.object({
  categoryId: idSchema,
  name: z.string().trim().min(1, 'Ürün adı gerekli').max(80, 'En fazla 80 karakter'),
  description: optionalText(200),
  price: priceValue,
  unit: optionalText(20),
  imageId: z.string().min(1).nullable().optional(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})
export type PriceItemInput = z.infer<typeof priceItemSchema>

export const reorderSchema = z.object({
  ids: z.array(idSchema).min(1).max(200),
})
