import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export const staffListInclude = {
  assignments: { select: { shopId: true, shop: { select: { name: true } } } },
} satisfies Prisma.StaffUserInclude

export type StaffListItem = Prisma.StaffUserGetPayload<{ include: typeof staffListInclude }>

export async function listStaff(): Promise<StaffListItem[]> {
  return db.staffUser.findMany({
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    include: staffListInclude,
  })
}

export async function getStaffById(id: string): Promise<StaffListItem | null> {
  return db.staffUser.findUnique({ where: { id }, include: staffListInclude })
}

export async function listShopOptions(): Promise<{ id: string; name: string }[]> {
  return db.shop.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true },
  })
}
