import { z } from 'zod'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, MEDIA_OWNER_KINDS } from './paths'

export const requestUploadSchema = z.object({
  ownerKind: z.enum(MEDIA_OWNER_KINDS),
  ownerId: z.string().min(1).max(64),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES, { error: 'Yalnızca JPEG, PNG, WebP veya AVIF yükleyin' }),
  sizeBytes: z.int().positive().max(MAX_UPLOAD_BYTES, 'Dosya 10 MB sınırını aşıyor'),
})
export type RequestUploadInput = z.infer<typeof requestUploadSchema>

export const finalizeUploadSchema = z.object({
  path: z.string().min(1).max(200),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES),
  sizeBytes: z.int().positive().max(MAX_UPLOAD_BYTES),
  width: z.int().positive().max(20000),
  height: z.int().positive().max(20000),
  alt: z.string().trim().max(160).nullable().optional(),
})
export type FinalizeUploadInput = z.infer<typeof finalizeUploadSchema>
