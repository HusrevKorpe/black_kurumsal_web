import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { StaffRole } from '@/generated/prisma/enums'
import { isOwner, type StaffContext } from '@/lib/auth/authorize'
import { ROUTES } from '@/lib/constants/routes'
import { db } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface CurrentStaff extends StaffContext {
  email: string
  fullName: string
  role: StaffRole
}

/**
 * Oturumdaki personeli döndürür. Supabase kullanıcısı var ama StaffUser kaydı yok/pasif ise null.
 * Aynı istek içinde tekrar çağrılar önbellekten gelir.
 */
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const staff = await db.staffUser.findUnique({
    where: { id: user.id },
    // Silinen dükkan atamadan düşer: sorumlu, silinmiş dükkanı doğrudan adresten de düzenleyemez.
    include: { assignments: { where: { shop: { deletedAt: null } }, select: { shopId: true } } },
  })
  if (!staff || !staff.isActive) return null

  return {
    id: staff.id,
    email: staff.email,
    fullName: staff.fullName,
    role: staff.role,
    shopIds: staff.assignments.map((a) => a.shopId),
  }
})

/**
 * Personel değilse zorunlu çıkışa yönlendirir. Doğrudan giriş sayfasına yollanmaz; çünkü
 * Supabase oturumu hâlâ açıkken proxy giriş sayfasını yeniden /admin'e çevirir (sonsuz döngü).
 */
export async function requireStaff(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff()
  if (!staff) redirect(`${ROUTES.admin.signOut}?reason=unauthorized`)
  return staff
}

/** Yalnızca patron. Sorumlu gelirse özet sayfasına, açıklayıcı uyarıyla döner (500 yerine). */
export async function requireOwner(): Promise<CurrentStaff> {
  const staff = await requireStaff()
  if (!isOwner(staff)) redirect(`${ROUTES.admin.root}?yetki=yok`)
  return staff
}
