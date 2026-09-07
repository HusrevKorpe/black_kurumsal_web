import { z } from 'zod'
import { idSchema } from '@/lib/validation/common'

/** Galeri sahibi: dükkan VEYA mekan. */
export const galleryOwnerSchema = z
  .object({ shopId: idSchema.optional(), locationId: idSchema.optional() })
  .refine(
    (o) => Boolean(o.shopId) !== Boolean(o.locationId),
    'Dükkan veya mekan seçin (yalnızca biri)',
  )
export type GalleryOwner = z.infer<typeof galleryOwnerSchema>

export const addGalleryImagesSchema = z.object({
  owner: galleryOwnerSchema,
  mediaIds: z.array(idSchema).min(1).max(30),
})

export const reorderGallerySchema = z.object({
  owner: galleryOwnerSchema,
  ids: z.array(idSchema).min(1).max(200),
})

export const captionSchema = z.object({
  id: idSchema,
  caption: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(120).nullable(),
  ),
})
