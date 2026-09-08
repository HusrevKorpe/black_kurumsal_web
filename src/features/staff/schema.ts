import { z } from 'zod'
import { StaffRole } from '@/generated/prisma/enums'
import { idSchema } from '@/lib/validation/common'

/**
 * Panel şifresinin ASIL kapısı burasıdır. Kullanıcı `auth.admin.createUser` /
 * `updateUserById` ile açılır ve servis anahtarıyla giden bu yol GoTrue'nun kendi şifre kuralını
 * atlar; `supabase/config.toml`'daki `minimum_password_length` / `password_requirements` yalnızca
 * kullanıcıya açık akışları bağlar. İkisi yine de aynı tutulur (bkz. o dosyadaki not).
 */
const passwordSchema = z
  .string()
  .min(12, 'Şifre en az 12 karakter olmalı')
  .max(72, 'Şifre en fazla 72 karakter')
  .refine(
    (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p),
    'Şifre küçük harf, büyük harf ve rakam içermeli',
  )

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
