import { beforeEach, describe, expect, it } from 'vitest'
import { applyDemoContent } from '@/features/content/demo'
import {
  DEFAULT_DEMO_SHOP_SLUGS,
  DEMO_CAMPAIGNS,
  DEMO_LOCATIONS,
  DEMO_SHOPS,
} from '@/features/content/demo-data'
import { GALLERY_COUNT } from '@/features/content/demo-fill'
import type { ImageUploader } from '@/features/content/demo-media'
import { ensureContentSkeleton } from '@/features/content/skeleton'
import { SKELETON_SHOPS, type SkeletonShopSlug } from '@/features/content/skeleton-data'
import { parseMediaPath } from '@/features/media/paths'
import { db } from '@/lib/db'
import { createMedia, createOwner, resetDatabase } from './helpers'

const DEFAULT: SkeletonShopSlug[] = [...DEFAULT_DEMO_SHOP_SLUGS]
const DEFAULT_SET = new Set<string>(DEFAULT)
const OTHERS = SKELETON_SHOPS.map((s) => s.slug).filter((slug) => !DEFAULT_SET.has(slug))
const CAMPAIGN_TITLES = DEMO_CAMPAIGNS.map((c) => c.title)

/** Depolamaya dokunmayan yükleyici: yolları ve gövde boyutlarını kaydeder. */
function fakeUploader() {
  const uploaded: string[] = []
  const upload: ImageUploader = async (path, body, contentType) => {
    if (contentType !== 'image/webp') throw new Error(`beklenmeyen tür: ${contentType}`)
    if (body.byteLength === 0) throw new Error('boş gövde')
    if (uploaded.includes(path)) throw new Error(`aynı yola ikinci yazma: ${path}`)
    uploaded.push(path)
  }
  return { upload, uploaded }
}

const shopWithDetails = (slug: string) =>
  db.shop.findUniqueOrThrow({
    where: { slug },
    include: {
      coverImage: true,
      hours: true,
      gallery: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      priceCategories: { include: { items: true }, orderBy: { sortOrder: 'asc' } },
    },
  })

beforeEach(resetDatabase)

describe('örnek içerik (applyDemoContent)', () => {
  it('iskelet üstünde varsayılan 4 dükkanı, Garden mekanını ve 3 kampanyayı doldurur; diğer dükkana dokunmaz', async () => {
    await ensureContentSkeleton(db)
    const owner = await createOwner()
    const { upload, uploaded } = fakeUploader()

    const result = await applyDemoContent(db, { upload })
    expect(result).toEqual({
      locations: { filled: ['black-garden'], skipped: [] },
      shops: { filled: DEFAULT, skipped: [] },
      campaigns: { created: CAMPAIGN_TITLES, skipped: false },
    })

    for (const slug of DEFAULT) {
      const demo = DEMO_SHOPS[slug]
      const shop = await shopWithDetails(slug)
      expect(shop).toMatchObject({
        description: demo.description,
        address: demo.address ?? null,
        phone: demo.phone ?? null,
        whatsapp: demo.whatsapp ?? null,
        features: demo.features,
      })
      expect(parseMediaPath(shop.coverImage?.path ?? '')).toEqual({
        kind: 'shop',
        ownerId: shop.id,
      })
      expect(shop.hours).toHaveLength(demo.hours ? 7 : 0)
      expect(shop.gallery.map((g) => g.sortOrder)).toEqual([...Array(GALLERY_COUNT).keys()])
      for (const image of shop.gallery) {
        expect(parseMediaPath(image.media.path)).toEqual({ kind: 'shop', ownerId: shop.id })
      }
      expect(shop.priceCategories.map((c) => c.name)).toEqual(
        demo.priceCategories.map((c) => c.name),
      )
      expect(shop.priceCategories.map((c) => c.items.length)).toEqual(
        demo.priceCategories.map((c) => c.items.length),
      )
    }
    for (const slug of OTHERS) {
      const shop = await shopWithDetails(slug)
      expect(shop).toMatchObject({
        description: null,
        phone: null,
        features: [],
        coverImageId: null,
      })
      expect(shop.hours).toHaveLength(0)
      expect(shop.gallery).toHaveLength(0)
      expect(shop.priceCategories).toHaveLength(0)
    }

    const garden = await db.location.findUniqueOrThrow({
      where: { slug: 'black-garden' },
      include: { coverImage: true, hours: true },
    })
    const gardenDemo = DEMO_LOCATIONS['black-garden']
    expect(garden).toMatchObject({ address: gardenDemo.address, phone: gardenDemo.phone })
    expect(garden.hours).toHaveLength(7)
    expect(parseMediaPath(garden.coverImage?.path ?? '')).toEqual({
      kind: 'location',
      ownerId: garden.id,
    })
    for (const slug of ['carsi']) {
      const district = await db.location.findUniqueOrThrow({ where: { slug } })
      expect(district).toMatchObject({ address: null, phone: null, coverImageId: null })
    }

    const campaigns = await db.campaign.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { image: true, shop: true, location: true },
    })
    expect(campaigns.map((c) => [c.title, c.scope, c.shop?.slug, c.location?.slug])).toEqual([
      ['Black Garden Açıldı', 'GLOBAL', undefined, undefined],
      ['Cuma Turnuva Gecesi', 'SHOP', 'black-playstation-carsi', undefined],
      ['Hafta Sonu Aile Menüsü', 'LOCATION', undefined, 'black-garden'],
    ])
    for (const campaign of campaigns) {
      expect(campaign.createdById).toBe(owner.id)
      expect(campaign.image.path.startsWith(`campaign/${owner.id}/`)).toBe(true)
    }

    const mediaPaths = (await db.media.findMany({ select: { path: true } })).map((m) => m.path)
    expect(uploaded).toHaveLength(DEFAULT.length * (1 + GALLERY_COUNT) + 1 + CAMPAIGN_TITLES.length)
    expect(new Set(mediaPaths)).toEqual(new Set(uploaded))

    const logs = await db.auditLog.findMany({ where: { action: 'content.demo' } })
    expect(logs.map((l) => l.entityType).sort()).toEqual(
      ['Campaign', 'Location', ...DEFAULT.map(() => 'Shop')].sort(),
    )
    expect(logs.every((l) => l.staffId === null)).toBe(true)
  })

  it('ikinci çalıştırma hiçbir şey yazmaz: hepsi atlanır, yükleme yapılmaz, günlüğe düşmez', async () => {
    await ensureContentSkeleton(db)
    const first = fakeUploader()
    await applyDemoContent(db, { upload: first.upload })
    const before = {
      media: await db.media.count(),
      hours: await db.openingHours.count(),
      items: await db.priceItem.count(),
      logs: await db.auditLog.count(),
    }

    const second = fakeUploader()
    const result = await applyDemoContent(db, { upload: second.upload })
    expect(result).toEqual({
      locations: { filled: [], skipped: ['black-garden'] },
      shops: { filled: [], skipped: DEFAULT },
      campaigns: { created: [], skipped: true },
    })
    expect(second.uploaded).toEqual([])
    expect({
      media: await db.media.count(),
      hours: await db.openingHours.count(),
      items: await db.priceItem.count(),
      logs: await db.auditLog.count(),
    }).toEqual(before)
  })

  it('panelden dolu dükkan ve mekan atlanır; kampanya varsa örnek kampanya açılmaz', async () => {
    await ensureContentSkeleton(db)
    await db.shop.update({
      where: { slug: 'black-playstation-carsi' },
      data: { phone: '0555 111 11 11' },
    })
    await db.location.update({
      where: { slug: 'black-garden' },
      data: { address: 'Patronun girdiği adres' },
    })
    const media = await createMedia('campaign/x/00000000-0000-4000-8000-000000000000.webp')
    await db.campaign.create({
      data: { title: 'Patronun kampanyası', imageId: media.id, scope: 'GLOBAL' },
    })
    const { upload, uploaded } = fakeUploader()

    const result = await applyDemoContent(db, {
      upload,
      shopSlugs: ['black-playstation-carsi', 'black-tavuk-garden'],
    })
    expect(result).toEqual({
      locations: { filled: [], skipped: ['black-garden'] },
      shops: { filled: ['black-tavuk-garden'], skipped: ['black-playstation-carsi'] },
      campaigns: { created: [], skipped: true },
    })
    expect(uploaded).toHaveLength(1 + GALLERY_COUNT)

    const playstation = await shopWithDetails('black-playstation-carsi')
    expect(playstation).toMatchObject({ phone: '0555 111 11 11', description: null })
    expect(playstation.priceCategories).toHaveLength(0)
    const garden = await db.location.findUniqueOrThrow({
      where: { slug: 'black-garden' },
      include: { hours: true },
    })
    expect(garden).toMatchObject({ address: 'Patronun girdiği adres', phone: null })
    expect(garden.hours).toHaveLength(0)
    expect(await db.campaign.count()).toBe(1)
    expect((await shopWithDetails('black-tavuk-garden')).priceCategories.length).toBeGreaterThan(0)
  })

  it('yalnızca bölge dükkanı seçilince Garden’a ve mekan/dükkan kampanyalarına dokunulmaz', async () => {
    await ensureContentSkeleton(db)
    const { upload } = fakeUploader()
    const result = await applyDemoContent(db, { upload, shopSlugs: ['black-tost-carsi'] })
    expect(result).toEqual({
      locations: { filled: [], skipped: [] },
      shops: { filled: ['black-tost-carsi'], skipped: [] },
      campaigns: { created: ['Black Garden Açıldı'], skipped: false },
    })
    const garden = await db.location.findUniqueOrThrow({ where: { slug: 'black-garden' } })
    expect(garden).toMatchObject({ address: null, coverImageId: null })
    const campaign = await db.campaign.findFirstOrThrow()
    expect(campaign).toMatchObject({ scope: 'GLOBAL', createdById: null })
    expect((await db.media.findUniqueOrThrow({ where: { id: campaign.imageId } })).path).toMatch(
      /^campaign\/demo\//,
    )
  })

  it('seçim doğrulanır: bilinmeyen slug, boş seçim ve kurulmamış iskelet hata verir; hiçbir şey yazılmaz', async () => {
    const { upload, uploaded } = fakeUploader()
    await expect(applyDemoContent(db, { upload, shopSlugs: ['yok-boyle'] })).rejects.toThrow(
      'İskelette olmayan dükkan: yok-boyle',
    )
    await expect(applyDemoContent(db, { upload, shopSlugs: [] })).rejects.toThrow(
      'Doldurulacak dükkan seçilmedi',
    )
    await expect(applyDemoContent(db, { upload, shopSlugs: ['lavinya-apart'] })).rejects.toThrow(
      /content:init/,
    )
    expect(uploaded).toEqual([])
    expect(await db.media.count()).toBe(0)
  })
})
