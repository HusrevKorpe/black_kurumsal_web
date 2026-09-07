import 'server-only'
import { assertOwner, assertShopAccess, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import type { MediaOwnerKind } from './paths'

/**
 * Bir personel bu sahibe görsel yükleyebilir mi?
 * shop / price-item: dükkana erişim. location / settings: patron. campaign: yükleyen kişi (ownerId = staff.id).
 */
export async function assertMediaOwnerAccess(
  staff: StaffContext,
  kind: MediaOwnerKind,
  ownerId: string,
): Promise<void> {
  switch (kind) {
    case 'shop':
    case 'price-item': {
      assertShopAccess(staff, ownerId)
      const exists = await db.shop.count({ where: { id: ownerId, deletedAt: null } })
      if (exists === 0) throw new Error('Dükkan bulunamadı')
      return
    }
    case 'location': {
      assertOwner(staff)
      const exists = await db.location.count({ where: { id: ownerId, deletedAt: null } })
      if (exists === 0) throw new Error('Mekan bulunamadı')
      return
    }
    case 'settings':
      assertOwner(staff)
      return
    case 'campaign':
      if (staff.role !== 'OWNER' && ownerId !== staff.id) assertOwner(staff)
      return
  }
}
