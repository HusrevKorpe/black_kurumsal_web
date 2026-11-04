import { logAudit } from '@/features/audit/log'
import type { LocationKind, ShopType } from '@/generated/prisma/enums'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'
import { SKELETON_LOCATIONS, SKELETON_SHOPS } from './skeleton-data'

/**
 * Yapı eşitleme (`pnpm content:sync`): veritabanındaki mekan ve dükkan listesini `skeleton-data.ts`'e
 * uydurur. `content:init`'in tersine var olan kayda da dokunur, ama yalnızca YAPI alanlarına: ad, tür,
 * bağlı olduğu mekan ve sıra. Telefon, adres, saat, fiyat, görsel ve "yayında" durumu olduğu gibi kalır.
 *
 *  - İskelette olup veritabanında olmayan kayıt açılır.
 *  - Silinmiş (çöp kutusundaki) eski kayıt geri getirilmez: içinde demo telefonu, adresi ve görseli
 *    olabilir. Slug'ı `-eski-<id>` ile boşaltılır, yerine boş bir kayıt açılır; eskisi DB'de durur.
 *  - İskelette olmayan yayındaki kayıt silinir (`deletedAt`), satırı ve görselleri DB'de kalır.
 *
 * Tek transaction; günlüğe `content.sync` satırı düşer. Tekrar çalıştırmak güvenlidir.
 */
const TX_OPTIONS = { timeout: 60_000 }
const ACTION = 'content.sync'

export interface ExistingLocation {
  id: string
  slug: string
  name: string
  kind: LocationKind
  sortOrder: number
  deletedAt: Date | null
}

export interface ExistingShop {
  id: string
  slug: string
  name: string
  type: ShopType
  sortOrder: number
  deletedAt: Date | null
  location: { slug: string } | null
}

export interface Change {
  slug: string
  name: string
  /** Değişen yapı alanları: "ad: X → Y". */
  fields: string[]
}

export interface SyncPart {
  create: { slug: string; name: string }[]
  /** Çöp kutusundaki eski kaydın slug'ı boşaltılır, yerine yenisi açılır. */
  archive: { id: string; slug: string; to: string }[]
  update: (Change & { id: string })[]
  remove: { id: string; slug: string; name: string }[]
}

export interface SyncPlan {
  locations: SyncPart
  shops: SyncPart
}

const emptyPart = (): SyncPart => ({ create: [], archive: [], update: [], remove: [] })

export function archivedSlug(slug: string, id: string): string {
  return `${slug}-eski-${id.slice(-8)}`
}

function diff(pairs: [label: string, from: unknown, to: unknown][]): string[] {
  return pairs
    .filter(([, from, to]) => from !== to)
    .map(([label, from, to]) => `${label}: ${String(from ?? '—')} → ${String(to ?? '—')}`)
}

export function buildSyncPlan(input: {
  locations: readonly ExistingLocation[]
  shops: readonly ExistingShop[]
}): SyncPlan {
  const plan: SyncPlan = { locations: emptyPart(), shops: emptyPart() }

  const locationsBySlug = new Map(input.locations.map((row) => [row.slug, row]))
  for (const want of SKELETON_LOCATIONS) {
    const row = locationsBySlug.get(want.slug)
    if (row && row.deletedAt === null) {
      const fields = diff([
        ['ad', row.name, want.name],
        ['tür', row.kind, want.kind],
        ['sıra', row.sortOrder, want.sortOrder],
      ])
      if (fields.length > 0)
        plan.locations.update.push({ id: row.id, slug: want.slug, name: want.name, fields })
      continue
    }
    if (row)
      plan.locations.archive.push({
        id: row.id,
        slug: row.slug,
        to: archivedSlug(row.slug, row.id),
      })
    plan.locations.create.push({ slug: want.slug, name: want.name })
  }
  const wantedLocations = new Set<string>(SKELETON_LOCATIONS.map((l) => l.slug))
  for (const row of input.locations) {
    if (row.deletedAt === null && !wantedLocations.has(row.slug)) {
      plan.locations.remove.push({ id: row.id, slug: row.slug, name: row.name })
    }
  }

  const shopsBySlug = new Map(input.shops.map((row) => [row.slug, row]))
  for (const want of SKELETON_SHOPS) {
    const row = shopsBySlug.get(want.slug)
    if (row && row.deletedAt === null) {
      const fields = diff([
        ['ad', row.name, want.name],
        ['tür', row.type, want.type],
        ['mekan', row.location?.slug ?? null, want.locationSlug],
        ['sıra', row.sortOrder, want.sortOrder],
      ])
      if (fields.length > 0)
        plan.shops.update.push({ id: row.id, slug: want.slug, name: want.name, fields })
      continue
    }
    if (row)
      plan.shops.archive.push({ id: row.id, slug: row.slug, to: archivedSlug(row.slug, row.id) })
    plan.shops.create.push({ slug: want.slug, name: want.name })
  }
  const wantedShops = new Set<string>(SKELETON_SHOPS.map((s) => s.slug))
  for (const row of input.shops) {
    if (row.deletedAt === null && !wantedShops.has(row.slug)) {
      plan.shops.remove.push({ id: row.id, slug: row.slug, name: row.name })
    }
  }
  return plan
}

export function isEmptyPlan(plan: SyncPlan): boolean {
  return [plan.locations, plan.shops].every(
    (part) =>
      part.create.length + part.archive.length + part.update.length + part.remove.length === 0,
  )
}

type Client = Pick<PrismaClient, 'location' | 'shop'>

async function readState(db: Client) {
  const [locations, shops] = await Promise.all([
    db.location.findMany({
      select: { id: true, slug: true, name: true, kind: true, sortOrder: true, deletedAt: true },
    }),
    db.shop.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        sortOrder: true,
        deletedAt: true,
        location: { select: { slug: true } },
      },
    }),
  ])
  return { locations, shops }
}

export async function planSync(db: PrismaClient): Promise<SyncPlan> {
  return buildSyncPlan(await readState(db))
}

async function applyLocations(
  tx: Prisma.TransactionClient,
  plan: SyncPlan,
  now: Date,
): Promise<Map<string, string>> {
  for (const row of plan.locations.archive) {
    await tx.location.update({ where: { id: row.id }, data: { slug: row.to } })
  }
  for (const row of plan.locations.remove) {
    await tx.location.update({ where: { id: row.id }, data: { deletedAt: now } })
  }
  const ids = new Map<string, string>()
  for (const want of SKELETON_LOCATIONS) {
    const data = { name: want.name, kind: want.kind, sortOrder: want.sortOrder }
    const saved = await tx.location.upsert({
      where: { slug: want.slug },
      create: { slug: want.slug, ...data },
      update: data,
      select: { id: true },
    })
    ids.set(want.slug, saved.id)
  }
  return ids
}

async function applyShops(
  tx: Prisma.TransactionClient,
  plan: SyncPlan,
  locationIds: Map<string, string>,
  now: Date,
): Promise<void> {
  for (const row of plan.shops.archive) {
    await tx.shop.update({ where: { id: row.id }, data: { slug: row.to } })
  }
  for (const row of plan.shops.remove) {
    await tx.shop.update({ where: { id: row.id }, data: { deletedAt: now } })
  }
  for (const want of SKELETON_SHOPS) {
    const locationId = want.locationSlug ? locationIds.get(want.locationSlug) : null
    if (locationId === undefined)
      throw new Error(`${want.slug} için ${want.locationSlug} mekanı yok`)
    const data = { name: want.name, type: want.type, locationId, sortOrder: want.sortOrder }
    await tx.shop.upsert({
      where: { slug: want.slug },
      create: { slug: want.slug, ...data },
      update: data,
    })
  }
}

/** Planı uygular ve uygulanan planı döner. Plan boşsa hiçbir şey yazılmaz. */
export async function applySync(db: PrismaClient): Promise<SyncPlan> {
  return db.$transaction(async (tx) => {
    const plan = buildSyncPlan(await readState(tx))
    if (isEmptyPlan(plan)) return plan
    const now = new Date()
    const locationIds = await applyLocations(tx, plan, now)
    await applyShops(tx, plan, locationIds, now)
    await logAudit(tx, {
      staffId: null,
      action: ACTION,
      entityType: 'content',
      summary:
        `Dükkan listesi eşitlendi: ${plan.shops.create.length} dükkan açıldı, ` +
        `${plan.shops.remove.length} silindi, ${plan.shops.update.length} güncellendi`,
      data: JSON.parse(JSON.stringify(plan)) as Prisma.InputJsonValue,
    })
    return plan
  }, TX_OPTIONS)
}
