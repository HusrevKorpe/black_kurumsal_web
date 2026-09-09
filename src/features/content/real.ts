import { logAudit } from '@/features/audit/log'
import { DAYS_OF_WEEK } from '@/features/hours/types'
import type { PrismaClient } from '@/generated/prisma/client'
import { REAL_SHOP_CONTENT, REAL_SHOP_SLUGS, type RealShopSlug } from './real-data'

/**
 * Gerçek içeriği (`pnpm content:real`) veritabanına yazar: patronun gönderdiği fiyat listesi ve çalışma
 * saatleri. Demo doldurmanın tersine BOŞLUK ARAMAZ — seçili dükkanın fiyat listesinin tamamını
 * `real-data.ts`'deki listeyle değiştirir ve saatlerini yeniden yazar. Sebebi: bu dükkanlarda çoğunlukla
 * demo fiyatı vardır, gerçek fiyat onun yanına eklenirse sitede iki liste görünür.
 *
 * Dokunulmayan alanlar: açıklama, adres, telefon, WhatsApp, Instagram, özellikler, kapak ve galeri.
 * Her dükkan kendi transaction'ında yazılır ve günlüğe `content.real` satırı düşer.
 */
const TX_OPTIONS = { timeout: 60_000 }
const ACTION = 'content.real'

/** Değiştirilecek mevcut kategori: sitede şu an ne yazıyor. */
export interface ReplacedCategory {
  name: string
  items: number
}

export interface RealShopPlan {
  slug: RealShopSlug
  shopId: string
  name: string
  source: string
  /** Yazılacak kategori ve ürün sayısı; fiyat listesi verilmediyse ikisi de 0. */
  categories: number
  items: number
  replaced: ReplacedCategory[]
  /** Saat verilmediyse null. `from` boşsa dükkanın kendi saati yoktu (mekanınkini devralıyordu). */
  hours: { from: string | null; to: string } | null
}

function selectSlugs(slugs: readonly string[] | undefined): RealShopSlug[] {
  if (slugs === undefined) return [...REAL_SHOP_SLUGS]
  const wanted = [...new Set(slugs)]
  const unknown = wanted.filter((slug) => !(slug in REAL_SHOP_CONTENT))
  if (unknown.length > 0) {
    throw new Error(
      `Gerçek içeriği olmayan dükkan: ${unknown.join(', ')}. Önce real-data.ts'e ekleyin.`,
    )
  }
  if (wanted.length === 0) throw new Error('Yazılacak dükkan seçilmedi')
  return wanted as RealShopSlug[]
}

const SHOP_SELECT = {
  id: true,
  name: true,
  hours: {
    orderBy: { dayOfWeek: 'asc' },
    select: { opensAt: true, closesAt: true, isClosed: true },
  },
  priceCategories: {
    orderBy: { sortOrder: 'asc' },
    select: { name: true, _count: { select: { items: true } } },
  },
} as const

type ShopRow = {
  id: string
  name: string
  hours: { opensAt: string | null; closesAt: string | null; isClosed: boolean }[]
  priceCategories: { name: string; _count: { items: number } }[]
}

/** Haftalık tabloyu tek satırda özetler: "10:00–02:00", "günlere göre değişiyor" ya da null (kayıt yok). */
function describeWeek(hours: ShopRow['hours']): string | null {
  if (hours.length === 0) return null
  const first = hours[0]
  if (first === undefined) return null
  const same = hours.every(
    (day) =>
      day.isClosed === first.isClosed &&
      day.opensAt === first.opensAt &&
      day.closesAt === first.closesAt,
  )
  if (!same) return 'günlere göre değişiyor'
  if (first.isClosed) return 'kapalı'
  return `${first.opensAt ?? '?'}–${first.closesAt ?? '?'}`
}

function toPlan(slug: RealShopSlug, shop: ShopRow): RealShopPlan {
  const content = REAL_SHOP_CONTENT[slug]
  const categories = content.priceCategories ?? []
  return {
    slug,
    shopId: shop.id,
    name: shop.name,
    source: content.source,
    categories: categories.length,
    items: categories.reduce((sum, category) => sum + category.items.length, 0),
    // Fiyat listesi verilmediyse mevcut liste yerinde kalır: silinecek bir şey yok.
    replaced:
      categories.length === 0
        ? []
        : shop.priceCategories.map((category) => ({
            name: category.name,
            items: category._count.items,
          })),
    hours: content.hours
      ? {
          from: describeWeek(shop.hours),
          to: `${content.hours.opensAt}–${content.hours.closesAt}`,
        }
      : null,
  }
}

/** Ne yazılacağını hesaplar, hiçbir şey değiştirmez (kuru çalışma). */
export async function planRealContent(
  db: PrismaClient,
  slugs?: readonly string[],
): Promise<RealShopPlan[]> {
  const plans: RealShopPlan[] = []
  for (const slug of selectSlugs(slugs)) {
    const shop = await db.shop.findFirst({ where: { slug, deletedAt: null }, select: SHOP_SELECT })
    if (!shop) {
      throw new Error(`${slug} veritabanında yok; önce \`pnpm content:init\` çalıştırın`)
    }
    plans.push(toPlan(slug, shop))
  }
  return plans
}

async function writeShop(db: PrismaClient, plan: RealShopPlan): Promise<void> {
  const content = REAL_SHOP_CONTENT[plan.slug]
  const { priceCategories, hours } = content
  await db.$transaction(async (tx) => {
    if (priceCategories) {
      // Kategori silinince ürünleri de gider (cascade); demo listesi gerçeğinin yanında kalmaz.
      await tx.priceCategory.deleteMany({ where: { shopId: plan.shopId } })
      for (const [sortOrder, category] of priceCategories.entries()) {
        await tx.priceCategory.create({
          data: {
            shopId: plan.shopId,
            name: category.name,
            description: category.description ?? null,
            sortOrder,
            items: {
              create: category.items.map((item, itemOrder) => ({
                name: item.name,
                description: item.description ?? null,
                price: item.price,
                unit: item.unit ?? null,
                sortOrder: itemOrder,
              })),
            },
          },
        })
      }
    }
    if (hours) {
      await tx.openingHours.deleteMany({ where: { shopId: plan.shopId } })
      await tx.openingHours.createMany({
        data: DAYS_OF_WEEK.map((dayOfWeek) => ({
          shopId: plan.shopId,
          dayOfWeek,
          opensAt: hours.opensAt,
          closesAt: hours.closesAt,
          isClosed: false,
        })),
      })
    }
    await logAudit(tx, {
      staffId: null,
      action: ACTION,
      entityType: 'Shop',
      entityId: plan.shopId,
      summary: `${plan.name}: gerçek fiyat/saat bilgisi yazıldı (${plan.categories} kategori, ${plan.items} ürün)`,
      data: {
        slug: plan.slug,
        source: plan.source,
        categories: plan.categories,
        items: plan.items,
        replaced: plan.replaced.map((category) => category.name),
        hours: plan.hours ? plan.hours.to : null,
      },
    })
  }, TX_OPTIONS)
}

/** Planı hesaplar ve yazar. Aynı veriyle tekrar çalıştırmak güvenlidir (liste baştan yazılır). */
export async function applyRealContent(
  db: PrismaClient,
  slugs?: readonly string[],
): Promise<RealShopPlan[]> {
  const plans = await planRealContent(db, slugs)
  for (const plan of plans) await writeShop(db, plan)
  return plans
}
