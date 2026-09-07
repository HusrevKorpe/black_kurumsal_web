import { logAudit } from '@/features/audit/log'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'
import { SKELETON_LOCATIONS, SKELETON_SETTINGS, SKELETON_SHOPS } from './skeleton-data'

/** Bir kayıt grubunda bu çağrıda açılan ve zaten var olan slug'lar. */
export interface SkeletonPart {
  created: string[]
  existing: string[]
}

export interface EnsureSkeletonResult {
  settingsCreated: boolean
  locations: SkeletonPart
  shops: SkeletonPart
}

type Tx = Prisma.TransactionClient

async function ensureSettings(tx: Tx): Promise<boolean> {
  const found = await tx.siteSettings.findUnique({ where: { id: 1 }, select: { id: true } })
  if (found) return false
  await tx.siteSettings.create({ data: { id: 1, ...SKELETON_SETTINGS } })
  return true
}

async function ensureLocations(tx: Tx): Promise<{ part: SkeletonPart; ids: Map<string, string> }> {
  const part: SkeletonPart = { created: [], existing: [] }
  const ids = new Map<string, string>()
  for (const loc of SKELETON_LOCATIONS) {
    const found = await tx.location.findUnique({ where: { slug: loc.slug }, select: { id: true } })
    if (found) {
      ids.set(loc.slug, found.id)
      part.existing.push(loc.slug)
      continue
    }
    const created = await tx.location.create({
      data: { slug: loc.slug, name: loc.name, kind: loc.kind, sortOrder: loc.sortOrder },
      select: { id: true },
    })
    ids.set(loc.slug, created.id)
    part.created.push(loc.slug)
  }
  return { part, ids }
}

async function ensureShops(tx: Tx, locationIds: Map<string, string>): Promise<SkeletonPart> {
  const part: SkeletonPart = { created: [], existing: [] }
  for (const shop of SKELETON_SHOPS) {
    const found = await tx.shop.findUnique({ where: { slug: shop.slug }, select: { id: true } })
    if (found) {
      part.existing.push(shop.slug)
      continue
    }
    const locationId = shop.locationSlug ? locationIds.get(shop.locationSlug) : null
    if (locationId === undefined) {
      throw new Error(`İskelet tutarsız: ${shop.slug} için ${shop.locationSlug} mekanı yok`)
    }
    await tx.shop.create({
      data: {
        slug: shop.slug,
        name: shop.name,
        type: shop.type,
        locationId,
        sortOrder: shop.sortOrder,
      },
    })
    part.created.push(shop.slug)
  }
  return part
}

/**
 * İçerik iskeletini kurar (canlı ilk kurulum, `pnpm content:init`). Yalnızca EKSİK kayıtları açar:
 * var olan site ayarı, mekan ve dükkanlara dokunmaz, panelden yapılan düzenlemeler korunur; tekrar
 * çalıştırmak güvenlidir. Tek transaction: ya hepsi ya hiçbiri. Aktör yoktur; bir şey açıldıysa
 * günlüğe staffId'siz tek özet satırı düşer ki patron dükkanların nereden geldiğini görsün.
 */
export async function ensureContentSkeleton(db: PrismaClient): Promise<EnsureSkeletonResult> {
  return db.$transaction(async (tx) => {
    const settingsCreated = await ensureSettings(tx)
    const { part: locations, ids } = await ensureLocations(tx)
    const shops = await ensureShops(tx, ids)

    const createdCount = locations.created.length + shops.created.length
    if (settingsCreated || createdCount > 0) {
      await logAudit(tx, {
        staffId: null,
        action: 'content.skeleton',
        entityType: 'content',
        summary: `İçerik iskeleti kuruldu: ${locations.created.length} mekan/bölge, ${shops.created.length} dükkan`,
        data: { settingsCreated, locations: locations.created, shops: shops.created },
      })
    }
    return { settingsCreated, locations, shops }
  })
}
