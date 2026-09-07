import 'server-only'
import { logAudit } from '@/features/audit/log'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, assertShopAccess, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import { MAX_EXCEPTIONS } from './exceptions'
import { hoursExceptionSchema } from './schema'
import { dateKeyFromDbDate, dbDateFromKey, formatDateKey } from './time'

/** İstisna günün sahibi: dükkan (sorumlu da düzenler) veya mekan (yalnızca patron). */
export type HoursOwner = { kind: 'shop'; id: string } | { kind: 'location'; id: string }

function ownerWhere(owner: HoursOwner): Prisma.HoursExceptionWhereInput {
  return owner.kind === 'shop' ? { shopId: owner.id } : { locationId: owner.id }
}

function assertOwnerAccess(staff: StaffContext, owner: HoursOwner): void {
  if (owner.kind === 'shop') assertShopAccess(staff, owner.id)
  else assertOwner(staff)
}

async function ownerName(tx: Prisma.TransactionClient, owner: HoursOwner): Promise<string> {
  const row =
    owner.kind === 'shop'
      ? await tx.shop.findUniqueOrThrow({ where: { id: owner.id }, select: { name: true } })
      : await tx.location.findUniqueOrThrow({ where: { id: owner.id }, select: { name: true } })
  return row.name
}

/**
 * Bir günü kaydeder; aynı tarihte kayıt varsa üzerine yazar (tarih başına tek kayıt).
 * Geçmiş tarih de kabul edilir: kayıt zaten kendiliğinden etkisizdir, engellemeye gerek yok.
 */
export async function saveHoursException(
  staff: StaffContext,
  owner: HoursOwner,
  input: unknown,
): Promise<ActionResult<null>> {
  assertOwnerAccess(staff, owner)
  const parsed = hoursExceptionSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const { date, isClosed, opensAt, closesAt, note } = parsed.data
  const dbDate = dbDateFromKey(date)
  if (!dbDate) return fail('Geçerli bir tarih seçin.')

  const where = ownerWhere(owner)
  const data = {
    date: dbDate,
    isClosed,
    opensAt: isClosed ? null : opensAt,
    closesAt: isClosed ? null : closesAt,
    note,
  }

  return db.$transaction(async (tx) => {
    const existing = await tx.hoursException.findFirst({ where: { ...where, date: dbDate } })
    if (!existing) {
      const count = await tx.hoursException.count({ where })
      if (count >= MAX_EXCEPTIONS) {
        return fail(`En fazla ${MAX_EXCEPTIONS} özel gün tutulabilir. Geçmiş günleri silin.`)
      }
      await tx.hoursException.create({
        data: {
          ...data,
          ...(owner.kind === 'shop' ? { shopId: owner.id } : { locationId: owner.id }),
        },
      })
    } else {
      await tx.hoursException.update({ where: { id: existing.id }, data })
    }

    const name = await ownerName(tx, owner)
    await logAudit(tx, {
      staffId: staff.id,
      action: `${owner.kind}.hours.exception`,
      entityType: owner.kind === 'shop' ? 'Shop' : 'Location',
      entityId: owner.id,
      summary: `${name} · ${formatDateKey(date)} özel günü ${isClosed ? 'kapalı' : `${opensAt}–${closesAt}`} olarak kaydedildi`,
      data: { date, isClosed, opensAt, closesAt, note },
    })
    return ok(null)
  })
}

/** Kayıt gerçekten bu dükkanın/mekanın mı, silmeden önce doğrulanır. */
export async function deleteHoursException(
  staff: StaffContext,
  owner: HoursOwner,
  exceptionId: string,
): Promise<ActionResult<null>> {
  assertOwnerAccess(staff, owner)
  return db.$transaction(async (tx) => {
    const existing = await tx.hoursException.findFirst({
      where: { ...ownerWhere(owner), id: exceptionId },
    })
    if (!existing) return fail('Kayıt bulunamadı. Sayfa güncel olmayabilir.')

    await tx.hoursException.delete({ where: { id: existing.id } })
    const name = await ownerName(tx, owner)
    await logAudit(tx, {
      staffId: staff.id,
      action: `${owner.kind}.hours.exception.delete`,
      entityType: owner.kind === 'shop' ? 'Shop' : 'Location',
      entityId: owner.id,
      summary: `${name} · ${formatDateKey(dateKeyFromDbDate(existing.date))} özel günü kaldırıldı`,
    })
    return ok(null)
  })
}
