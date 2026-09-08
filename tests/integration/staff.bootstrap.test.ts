import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { ensureOwner } from '@/features/staff/bootstrap'
import { db } from '@/lib/db'
import { publicEnv } from '@/lib/env'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createShop, resetDatabase } from './helpers'

const TEST_EMAIL_DOMAIN = '@bootstrap.itest.black.local'
const admin = createSupabaseAdminClient()

async function cleanupAuthUsers() {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  for (const user of list.data?.users ?? []) {
    if (user.email?.endsWith(TEST_EMAIL_DOMAIN)) await admin.auth.admin.deleteUser(user.id)
  }
}

/** Gerçek giriş denemesi (anon anahtar): şifre auth tarafında geçerli mi? */
async function canSignIn(email: string, password: string): Promise<boolean> {
  const anon = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  )
  const { error } = await anon.auth.signInWithPassword({ email, password })
  return !error
}

beforeEach(async () => {
  await resetDatabase()
  await cleanupAuthUsers()
})
afterAll(cleanupAuthUsers)

describe('ilk patron kurulumu (ensureOwner)', () => {
  it('sıfırdan: auth kullanıcısı + OWNER kaydı; verilen şifreyle giriş yapılır', async () => {
    const email = `patron${Date.now()}${TEST_EMAIL_DOMAIN}`
    const result = await ensureOwner(db, admin, {
      email,
      fullName: 'İlk Patron',
      password: 'Ilk123456789',
    })
    expect(result.created).toBe(true)
    const row = await db.staffUser.findUniqueOrThrow({ where: { id: result.id } })
    expect(row).toMatchObject({ email, fullName: 'İlk Patron', role: 'OWNER', isActive: true })
    expect(await canSignIn(email, 'Ilk123456789')).toBe(true)
  })

  it('tekrar: aynı kimlik, şifre sıfırlanır, pasif/MANAGER kayıt OWNER ve aktif olur', async () => {
    const email = `tekrar${Date.now()}${TEST_EMAIL_DOMAIN}`
    const first = await ensureOwner(db, admin, {
      email,
      fullName: 'Patron',
      password: 'Eski12345678',
    })
    await db.staffUser.update({
      where: { id: first.id },
      data: { role: 'MANAGER', isActive: false },
    })

    const second = await ensureOwner(db, admin, {
      email,
      fullName: 'Patron Yeni',
      password: 'Yeni12345678',
    })
    expect(second).toEqual({ id: first.id, created: false })
    const row = await db.staffUser.findUniqueOrThrow({ where: { id: first.id } })
    expect(row).toMatchObject({ fullName: 'Patron Yeni', role: 'OWNER', isActive: true })
    expect(await canSignIn(email, 'Eski12345678')).toBe(false)
    expect(await canSignIn(email, 'Yeni12345678')).toBe(true)
  })

  it('auth kullanıcısı silinip yeniden açılınca kayıt ve atamaları yeni kimliğe taşınır', async () => {
    const email = `tasi${Date.now()}${TEST_EMAIL_DOMAIN}`
    const first = await ensureOwner(db, admin, {
      email,
      fullName: 'Patron',
      password: 'Eski12345678',
    })
    const shop = await createShop()
    await db.staffShopAssignment.create({ data: { staffId: first.id, shopId: shop.id } })
    await admin.auth.admin.deleteUser(first.id)

    const second = await ensureOwner(db, admin, {
      email,
      fullName: 'Patron',
      password: 'Yeni12345678',
    })
    expect(second.id).not.toBe(first.id)
    expect(second.created).toBe(false)
    expect(await db.staffUser.findUnique({ where: { id: first.id } })).toBeNull()
    const moved = await db.staffUser.findUniqueOrThrow({
      where: { email },
      include: { assignments: true },
    })
    expect(moved.id).toBe(second.id)
    expect(moved.assignments.map((a) => a.shopId)).toEqual([shop.id])
    expect(await canSignIn(email, 'Yeni12345678')).toBe(true)
  })

  it('geçersiz e-posta ve zayıf şifre reddedilir; auth kullanıcısı açılmaz', async () => {
    await expect(
      ensureOwner(db, admin, { email: 'gecersiz', fullName: 'X Y', password: 'Ilk123456789' }),
    ).rejects.toThrow()
    const email = `zayif${Date.now()}${TEST_EMAIL_DOMAIN}`
    await expect(
      ensureOwner(db, admin, { email, fullName: 'X Y', password: 'kisa' }),
    ).rejects.toThrow()
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    expect(list.data.users.some((u) => u.email === email)).toBe(false)
    expect(await db.staffUser.count()).toBe(0)
  })
})
