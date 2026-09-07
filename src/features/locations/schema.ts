import { z } from 'zod'
import { LocationKind } from '@/generated/prisma/enums'
import {
  optionalPhone,
  optionalText,
  optionalUrl,
  slugSchema,
  sortOrderSchema,
} from '@/lib/validation/common'

export const locationFormSchema = z.object({
  name: z.string().trim().min(2, 'En az 2 karakter').max(80, 'En fazla 80 karakter'),
  slug: slugSchema,
  kind: z.enum(LocationKind, { error: 'Tür seçin' }),
  description: optionalText(2000),
  address: optionalText(200),
  mapUrl: optionalUrl,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  instagramUrl: optionalUrl,
  isActive: z.boolean(),
  sortOrder: sortOrderSchema,
})
export type LocationFormInput = z.infer<typeof locationFormSchema>
