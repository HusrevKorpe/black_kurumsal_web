import type { StaffRole } from '@/generated/prisma/enums'

/** Oturumdaki personelin yetki kararları için gereken asgari bilgi. */
export interface StaffContext {
  id: string
  role: StaffRole
  shopIds: readonly string[]
}

export class AuthorizationError extends Error {
  constructor(message = 'Bu işlem için yetkiniz yok.') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export function isOwner(staff: StaffContext): boolean {
  return staff.role === 'OWNER'
}

/** Patron her dükkana, sorumlu yalnızca atandığı dükkanlara erişir. */
export function canAccessShop(staff: StaffContext, shopId: string): boolean {
  return isOwner(staff) || staff.shopIds.includes(shopId)
}

export function assertOwner(staff: StaffContext): void {
  if (!isOwner(staff)) throw new AuthorizationError()
}

export function assertShopAccess(staff: StaffContext, shopId: string): void {
  if (!canAccessShop(staff, shopId)) throw new AuthorizationError()
}

/** Sorumlunun görebileceği dükkan filtresi; patron için filtre yok. */
export function accessibleShopFilter(staff: StaffContext): { id: { in: string[] } } | undefined {
  return isOwner(staff) ? undefined : { id: { in: [...staff.shopIds] } }
}
