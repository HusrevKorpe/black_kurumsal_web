import type { Prisma, PrismaClient } from '@/generated/prisma/client'

export interface AuditEntry {
  staffId: string | null
  /** "shop.update", "campaign.create", "staff.password_reset" gibi. */
  action: string
  entityType: string
  entityId?: string | null
  /** İnsan okur: "Black Tost Çarşı güncellendi" */
  summary: string
  data?: Prisma.InputJsonValue
}

type Client = PrismaClient | Prisma.TransactionClient

/** İşlem günlüğüne yazar. Ana işlemle aynı transaction içinde çağrılmalıdır. */
export async function logAudit(client: Client, entry: AuditEntry): Promise<void> {
  await client.auditLog.create({
    data: {
      staffId: entry.staffId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      summary: entry.summary,
      data: entry.data,
    },
  })
}
