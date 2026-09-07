import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export const AUDIT_PAGE_SIZE = 30

export const auditInclude = {
  staff: { select: { fullName: true, email: true } },
} satisfies Prisma.AuditLogInclude
export type AuditLogRow = Prisma.AuditLogGetPayload<{ include: typeof auditInclude }>

export interface AuditPage {
  rows: AuditLogRow[]
  page: number
  totalPages: number
}

export async function listAuditLogs(page: number): Promise<AuditPage> {
  const safePage = Math.max(1, Math.floor(page) || 1)
  const [total, rows] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: auditInclude,
    }),
  ])
  return { rows, page: safePage, totalPages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) }
}

export async function listRecentAuditLogs(take = 6): Promise<AuditLogRow[]> {
  return db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take, include: auditInclude })
}
