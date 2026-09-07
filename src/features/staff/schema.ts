import { z } from 'zod'
import { StaffRole } from '@/generated/prisma/enums'
import { idSchema } from '@/lib/validation/common'

const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .max(72, 'Şifre en fazla 72 karakter')
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Şifre en az bir harf ve bir rakam içermeli')

export const createStaffSchema = z.object({
  email: z.email({ error: 'Geçerli bir e-posta girin' }).trim().toLowerCase(),
  fullName: z.string().trim().min(2, 'En az 2 karakter').max(60, 'En fazla 60 karakter'),
  role: z.enum(StaffRole, { error: 'Rol seçin' }),
  password: passwordSchema,
  shopIds: z.array(idSchema).max(50),
})
export type CreateStaffInput = z.infer<typeof createStaffSchema>

export const updateStaffSchema = z.object({
  id: idSchema,
  fullName: z.string().trim().min(2).max(60),
  role: z.enum(StaffRole),
  isActive: z.boolean(),
  shopIds: z.array(idSchema).max(50),
})
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>

export const resetPasswordSchema = z.object({
  id: idSchema,
  password: passwordSchema,
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
