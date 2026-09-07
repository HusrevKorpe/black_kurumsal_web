import 'server-only'
import { logAudit } from '@/features/audit/log'
import type { StaffUser } from '@/generated/prisma/client'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { tr } from '@/lib/i18n/tr'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createStaffSchema, resetPasswordSchema, updateStaffSchema } from './schema'

/**
 * Supabase Auth kullanıcısı + StaffUser kaydı. DB adımı başarısız olursa auth kullanıcısı geri silinir;
 * yarım kayıt kalmaz.
 */
export async function createStaff(
  actor: StaffContext,
  input: unknown,
): Promise<ActionResult<StaffUser>> {
  assertOwner(actor)
  const parsed = createStaffSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const { email, fullName, role, password, shopIds } = parsed.data

  const exists = await db.staffUser.findUnique({ where: { email } })
  if (exists) return fail(tr.errors.duplicate, { email: ['Bu e-posta zaten kayıtlı'] })

  const supabase = createSupabaseAdminClient()
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (created.error || !created.data.user) {
    const message = created.error?.message ?? ''
    if (/already|exists|registered/i.test(message))
      return fail(tr.errors.duplicate, { email: ['Bu e-posta zaten kayıtlı'] })
    return fail(`Kullanıcı oluşturulamadı: ${message}`)
  }
  const authId = created.data.user.id

  try {
    const staff = await db.$transaction(async (tx) => {
      const row = await tx.staffUser.create({
        data: {
          id: authId,
          email,
          fullName,
          role,
          assignments:
            role === 'MANAGER' ? { create: shopIds.map((shopId) => ({ shopId })) } : undefined,
        },
      })
      await logAudit(tx, {
        staffId: actor.id,
        action: 'staff.create',
        entityType: 'StaffUser',
        entityId: row.id,
        summary: `${fullName} (${tr.admin.roles[role]}) kullanıcısı oluşturuldu`,
      })
      return row
    })
    return ok(staff)
  } catch (error) {
    await supabase.auth.admin.deleteUser(authId).catch(() => undefined)
    throw error
  }
}

export async function updateStaff(
  actor: StaffContext,
  input: unknown,
): Promise<ActionResult<StaffUser>> {
  assertOwner(actor)
  const parsed = updateStaffSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const { id, fullName, role, isActive, shopIds } = parsed.data

  // Kilitlenme koruması: patron kendini pasife alamaz, rolünü düşüremez.
  if (id === actor.id && (!isActive || role !== 'OWNER')) return fail(tr.admin.users.selfLock)

  const staff = await db.$transaction(async (tx) => {
    const row = await tx.staffUser.update({ where: { id }, data: { fullName, role, isActive } })
    await tx.staffShopAssignment.deleteMany({ where: { staffId: id } })
    if (role === 'MANAGER' && shopIds.length > 0) {
      await tx.staffShopAssignment.createMany({
        data: shopIds.map((shopId) => ({ staffId: id, shopId })),
      })
    }
    await logAudit(tx, {
      staffId: actor.id,
      action: 'staff.update',
      entityType: 'StaffUser',
      entityId: id,
      summary: `${fullName} kullanıcısı güncellendi (${tr.admin.roles[role]}, ${isActive ? 'aktif' : 'pasif'})`,
    })
    return row
  })
  return ok(staff)
}

export async function resetStaffPassword(
  actor: StaffContext,
  input: unknown,
): Promise<ActionResult<null>> {
  assertOwner(actor)
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const target = await db.staffUser.findUnique({
    where: { id: parsed.data.id },
    select: { fullName: true },
  })
  if (!target) return fail(tr.errors.notFound)

  const supabase = createSupabaseAdminClient()
  const updated = await supabase.auth.admin.updateUserById(parsed.data.id, {
    password: parsed.data.password,
  })
  if (updated.error) return fail(`Şifre güncellenemedi: ${updated.error.message}`)

  await logAudit(db, {
    staffId: actor.id,
    action: 'staff.password_reset',
    entityType: 'StaffUser',
    entityId: parsed.data.id,
    summary: `${target.fullName} için şifre sıfırlandı`,
  })
  return ok(null)
}
