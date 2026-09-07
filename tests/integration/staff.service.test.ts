import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createStaff, resetStaffPassword, updateStaff } from '@/features/staff/service'
import { AuthorizationError } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createManager, createOwner, createShop, resetDatabase } from './helpers'

const TEST_EMAIL_DOMAIN = '@itest.black.local'
const supabase = createSupabaseAdminClient()

async function cleanupAuthUsers() {
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  for (const user of list.data?.users ?? []) {
    if (user.email?.endsWith(TEST_EMAIL_DOMAIN)) await supabase.auth.admin.deleteUser(user.id)
  }
}

beforeEach(async () => {
  await resetDatabase()
  await cleanupAuthUsers()
})
afterAll(cleanupAuthUsers)

describe('personel', () => {
  it('patron sorumlu oluşturur: auth kullanıcısı + kayıt + atamalar', async () => {
    const owner = await createOwner()
    const shop = await createShop()
    const email = `yeni${Date.now()}${TEST_EMAIL_DOMAIN}`
    const result = await createStaff(owner, {
      email,
      fullName: 'Yeni Sorumlu',
      role: 'MANAGER',
      password: 'Sifre1234',
      shopIds: [shop.id],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const row = await db.staffUser.findUniqueOrThrow({
      where: { id: result.data.id },
      include: { assignments: true },
    })
    expect(row.assignments.map((a) => a.shopId)).toEqual([shop.id])
    const auth = await supabase.auth.admin.getUserById(result.data.id)
    expect(auth.data.user?.email).toBe(email)
  })

  it('zayıf şifre ve tekrar e-posta reddedilir', async () => {
    const owner = await createOwner()
    const email = `tekrar${Date.now()}${TEST_EMAIL_DOMAIN}`
    const weak = await createStaff(owner, {
      email,
      fullName: 'X Y',
      role: 'MANAGER',
      password: 'kisa',
      shopIds: [],
    })
    expect(weak.ok).toBe(false)
    expect(
      (
        await createStaff(owner, {
          email,
          fullName: 'X Y',
          role: 'MANAGER',
          password: 'Sifre1234',
          shopIds: [],
        })
      ).ok,
    ).toBe(true)
    const dup = await createStaff(owner, {
      email,
      fullName: 'X Y',
      role: 'MANAGER',
      password: 'Sifre1234',
      shopIds: [],
    })
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.fieldErrors?.email).toBeDefined()
  })

  it('sorumlu kullanıcı yönetemez', async () => {
    const manager = await createManager([])
    await expect(
      createStaff(manager, {
        email: `m${TEST_EMAIL_DOMAIN}`,
        fullName: 'A B',
        role: 'MANAGER',
        password: 'Sifre1234',
        shopIds: [],
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('patron kendini pasife alamaz; başkasını pasife alır ve rolünü değiştirir', async () => {
    const owner = await createOwner()
    const self = await updateStaff(owner, {
      id: owner.id,
      fullName: 'Patron',
      role: 'OWNER',
      isActive: false,
      shopIds: [],
    })
    expect(self.ok).toBe(false)

    const shop = await createShop()
    const manager = await createManager([shop.id])
    const result = await updateStaff(owner, {
      id: manager.id,
      fullName: 'Sorumlu',
      role: 'OWNER',
      isActive: false,
      shopIds: [shop.id],
    })
    expect(result.ok).toBe(true)
    const row = await db.staffUser.findUniqueOrThrow({
      where: { id: manager.id },
      include: { assignments: true },
    })
    expect(row.role).toBe('OWNER')
    expect(row.isActive).toBe(false)
    expect(row.assignments).toHaveLength(0) // patronun ataması olmaz
  })

  it('şifre sıfırlama auth tarafında çalışır ve günlüğe şifre yazılmaz', async () => {
    const owner = await createOwner()
    const email = `sifre${Date.now()}${TEST_EMAIL_DOMAIN}`
    const created = await createStaff(owner, {
      email,
      fullName: 'Şifre Test',
      role: 'MANAGER',
      password: 'Eski12345',
      shopIds: [],
    })
    if (!created.ok) throw new Error('kullanıcı')
    const reset = await resetStaffPassword(owner, { id: created.data.id, password: 'Yeni12345' })
    expect(reset.ok).toBe(true)
    const login = await supabase.auth.signInWithPassword({ email, password: 'Yeni12345' })
    expect(login.error).toBeNull()
    const log = await db.auditLog.findFirst({ where: { action: 'staff.password_reset' } })
    expect(log?.summary).not.toContain('Yeni12345')
    expect(JSON.stringify(log?.data ?? null)).not.toContain('Yeni12345')
  })
})
