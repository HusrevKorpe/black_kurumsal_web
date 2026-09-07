import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'
import type { PrismaClient } from '@/generated/prisma/client'
import { createStaffSchema } from './schema'

/**
 * Panelden bağımsız personel kurulumu: seed ve ilk patron CLI'ı (`pnpm staff:owner`).
 * Aktör yoktur, işlem günlüğü yazılmaz. Panel içindeki oluşturma/sıfırlama `service.ts`'tedir.
 */

export type EnsureAuthUserResult = { id: string; created: boolean }

/**
 * Supabase Auth kullanıcısını oluşturur; varsa bulur ve şifresini verilen değere çeker.
 */
export async function ensureAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  fullName: string,
): Promise<EnsureAuthUserResult> {
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (!created.error && created.data.user) return { id: created.data.user.id, created: true }

  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (list.error) throw new Error(`Kullanıcı listesi alınamadı: ${list.error.message}`)
  const existing = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!existing) throw new Error(`Kullanıcı oluşturulamadı (${email}): ${created.error?.message}`)

  const updated = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  })
  if (updated.error) throw new Error(`Şifre güncellenemedi (${email}): ${updated.error.message}`)
  return { id: existing.id, created: false }
}

const ownerInputSchema = createStaffSchema.pick({ email: true, fullName: true, password: true })
export type EnsureOwnerInput = z.input<typeof ownerInputSchema>
/** `created`: StaffUser kaydı bu çağrıda açıldı (yoksa mevcut kayıt güncellendi). */
export type EnsureOwnerResult = { id: string; created: boolean }

/**
 * İlk patron hesabı (canlı kurulum ve kurtarma). Auth kullanıcısı yoksa oluşturur, varsa şifresini
 * sıfırlar; StaffUser kaydını OWNER ve aktif yapar. Auth kullanıcısı silinip yeniden açılmışsa
 * e-postayla duran eski kayıt yeni kimliğe taşınır (ilişkiler onUpdate: Cascade); atamalar,
 * yüklemeler ve günlük kayıtları kaybolmaz.
 */
export async function ensureOwner(
  db: PrismaClient,
  supabase: SupabaseClient,
  input: EnsureOwnerInput,
): Promise<EnsureOwnerResult> {
  const { email, fullName, password } = ownerInputSchema.parse(input)
  const { id } = await ensureAuthUser(supabase, email, password, fullName)
  const data = { email, fullName, role: 'OWNER' as const, isActive: true }

  const byId = await db.staffUser.findUnique({ where: { id }, select: { id: true } })
  const existing =
    byId ?? (await db.staffUser.findUnique({ where: { email }, select: { id: true } }))
  if (!existing) {
    await db.staffUser.create({ data: { id, ...data } })
    return { id, created: true }
  }
  await db.staffUser.update({ where: { id: existing.id }, data: { id, ...data } })
  return { id, created: false }
}
