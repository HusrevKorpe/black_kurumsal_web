import { beforeEach, describe, expect, it } from 'vitest'
import { resetDedupe } from '@/features/analytics/dedupe'
import { pruneAnalyticsEvents } from '@/features/analytics/prune'
import { getAnalyticsOverview } from '@/features/analytics/queries'
import { resetRateLimit } from '@/features/analytics/rate-limit'
import { buildRange } from '@/features/analytics/range'
import { recordEvent, resetSlugCache } from '@/features/analytics/service'
import { REPEAT_WINDOW_MS } from '@/lib/analytics/repeat'
import { db } from '@/lib/db'
import { createLocation, createMedia, createOwner, createShop, resetDatabase } from './helpers'

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

const OPTIONS = { salt: 'test-tuzu', siteHost: 'black.com.tr', now: new Date() }

function headers(overrides: Record<string, string> = {}): Headers {
  return new Headers({ 'user-agent': CHROME, 'x-forwarded-for': '1.2.3.4', ...overrides })
}

beforeEach(async () => {
  await resetDatabase()
  resetSlugCache()
  resetRateLimit()
  resetDedupe()
})

describe('olay kaydı', () => {
  it('dükkan sayfasındaki WhatsApp tıklamasını o dükkana yazar', async () => {
    const shop = await createShop({ slug: 'black-tost' })
    resetSlugCache()

    const result = await recordEvent({ type: 'whatsapp', path: '/black-tost' }, headers(), OPTIONS)

    expect(result.recorded).toBe(true)
    const event = await db.analyticsEvent.findFirstOrThrow()
    expect(event).toMatchObject({
      type: 'WHATSAPP_CLICK',
      path: '/black-tost',
      shopId: shop.id,
      locationId: null,
      device: 'DESKTOP',
    })
    expect(event.visitorHash).toHaveLength(16)
  })

  it('listeden karta tıklamayı hedef dükkana yazar, bulunulan sayfaya değil', async () => {
    const shop = await createShop({ slug: 'kalender-ps' })
    resetSlugCache()

    await recordEvent({ type: 'shop', path: '/', target: '/kalender-ps' }, headers(), OPTIONS)

    const event = await db.analyticsEvent.findFirstOrThrow()
    expect(event).toMatchObject({ type: 'SHOP_CARD_CLICK', path: '/', shopId: shop.id })
  })

  it('mekan sayfasını mekana bağlar', async () => {
    const location = await createLocation({ slug: 'black-garden' })
    resetSlugCache()

    await recordEvent({ type: 'view', path: '/mekan/black-garden' }, headers(), OPTIONS)

    const event = await db.analyticsEvent.findFirstOrThrow()
    expect(event).toMatchObject({ type: 'PAGE_VIEW', locationId: location.id, shopId: null })
  })

  it('yönlendiren siteyi kaynak olarak yazar, kendi sitemizi yazmaz', async () => {
    await recordEvent(
      { type: 'view', path: '/', referrer: 'https://www.google.com/search?q=black' },
      headers(),
      OPTIONS,
    )
    await recordEvent(
      { type: 'view', path: '/kampanyalar', referrer: 'https://black.com.tr/' },
      headers(),
      OPTIONS,
    )

    const events = await db.analyticsEvent.findMany({ orderBy: { path: 'asc' } })
    expect(events.map((event) => event.source)).toEqual(['google', null])
  })

  it('telefon ziyaretçisini MOBILE sayar', async () => {
    await recordEvent({ type: 'view', path: '/' }, headers({ 'user-agent': IPHONE }), OPTIONS)
    const event = await db.analyticsEvent.findFirstOrThrow()
    expect(event.device).toBe('MOBILE')
  })

  it('aynı gün aynı ziyaretçi tek imza, farklı ziyaretçi ayrı imza alır', async () => {
    await recordEvent({ type: 'view', path: '/' }, headers(), OPTIONS)
    await recordEvent({ type: 'view', path: '/kampanyalar' }, headers(), OPTIONS)
    await recordEvent(
      { type: 'view', path: '/' },
      headers({ 'x-forwarded-for': '9.9.9.9' }),
      OPTIONS,
    )

    const hashes = new Set((await db.analyticsEvent.findMany()).map((row) => row.visitorHash))
    expect(hashes.size).toBe(2)
  })

  it('kampanya tıklamasını kampanyaya bağlar, uydurma kimliği yok sayar', async () => {
    const owner = await createOwner()
    const image = await createMedia(`campaign/${owner.id}/a.webp`)
    const campaign = await db.campaign.create({
      data: { title: 'Turnuva', imageId: image.id, scope: 'GLOBAL' },
    })

    await recordEvent({ type: 'campaign', path: '/', campaignId: campaign.id }, headers(), OPTIONS)
    await recordEvent(
      { type: 'campaign', path: '/', campaignId: '01999999-9999-7999-8999-999999999999' },
      headers(),
      OPTIONS,
    )

    const events = await db.analyticsEvent.findMany({ orderBy: { createdAt: 'asc' } })
    expect(events).toHaveLength(2)
    expect(events[0]!.campaignId).toBe(campaign.id)
    expect(events[1]!.campaignId).toBeNull()
  })

  it('sabırsız ziyaretçinin tekrar tıklamasını bir kez sayar', async () => {
    const now = new Date('2026-09-07T12:00:00.000Z')
    const later = new Date(now.getTime() + REPEAT_WINDOW_MS)

    const first = await recordEvent({ type: 'whatsapp', path: '/' }, headers(), {
      ...OPTIONS,
      now,
    })
    const again = await recordEvent({ type: 'whatsapp', path: '/' }, headers(), {
      ...OPTIONS,
      now: new Date(now.getTime() + 5_000),
    })
    // Pencere dolduktan sonraki tıklama yeniden sayılır; başka düğme hiç beklemez.
    const afterWindow = await recordEvent({ type: 'whatsapp', path: '/' }, headers(), {
      ...OPTIONS,
      now: later,
    })
    const otherButton = await recordEvent({ type: 'call', path: '/' }, headers(), {
      ...OPTIONS,
      now,
    })
    // Başka ziyaretçinin aynı anda aynı düğmeye basması da sayılır.
    const otherVisitor = await recordEvent(
      { type: 'whatsapp', path: '/' },
      headers({ 'x-forwarded-for': '9.9.9.9' }),
      { ...OPTIONS, now },
    )

    expect([first.recorded, again.recorded, afterWindow.recorded]).toEqual([true, false, true])
    expect(again.reason).toBe('repeat')
    expect([otherButton.recorded, otherVisitor.recorded]).toEqual([true, true])
    expect(await db.analyticsEvent.count()).toBe(4)
  })

  it('robotu, personeli ve bilinmeyen olayı saymaz', async () => {
    const bot = await recordEvent(
      { type: 'view', path: '/' },
      headers({ 'user-agent': 'Googlebot/2.1' }),
      OPTIONS,
    )
    const staff = await recordEvent(
      { type: 'view', path: '/' },
      headers({ cookie: 'sb-abc-auth-token=xyz' }),
      OPTIONS,
    )
    const unknown = await recordEvent({ type: 'hack', path: '/' }, headers(), OPTIONS)
    const panel = await recordEvent({ type: 'view', path: '/admin/dukkanlar' }, headers(), OPTIONS)

    expect([bot.reason, staff.reason, unknown.reason, panel.reason]).toEqual([
      'bot',
      'staff',
      'invalid',
      'invalid',
    ])
    expect(await db.analyticsEvent.count()).toBe(0)
  })

  it('çöp kutusundaki dükkanın olayı da doğru kayda bağlanır', async () => {
    const shop = await createShop({ slug: 'kapali-dukkan' })
    await db.shop.update({ where: { id: shop.id }, data: { deletedAt: new Date() } })
    resetSlugCache()

    await recordEvent({ type: 'call', path: '/kapali-dukkan' }, headers(), OPTIONS)

    const event = await db.analyticsEvent.findFirstOrThrow()
    expect(event.shopId).toBe(shop.id)
  })
})

describe('panel toplamları', () => {
  it('dükkan satırlarını, sayfaları ve günlük seriyi doldurur', async () => {
    const shop = await createShop({ slug: 'black-tost', name: 'Black Tost' })
    resetSlugCache()
    const now = new Date()

    await recordEvent({ type: 'view', path: '/black-tost' }, headers(), { ...OPTIONS, now })
    await recordEvent(
      { type: 'view', path: '/black-tost' },
      headers({ 'x-forwarded-for': '5.5.5.5' }),
      { ...OPTIONS, now },
    )
    await recordEvent({ type: 'whatsapp', path: '/black-tost' }, headers(), { ...OPTIONS, now })
    await recordEvent({ type: 'call', path: '/black-tost' }, headers(), { ...OPTIONS, now })
    await recordEvent({ type: 'view', path: '/' }, headers(), { ...OPTIONS, now })

    const overview = await getAnalyticsOverview(buildRange(now, 7))

    expect(overview.isEmpty).toBe(false)
    expect(overview.totals.PAGE_VIEW).toBe(3)
    expect(overview.totals.WHATSAPP_CLICK).toBe(1)
    expect(overview.visitors).toBe(2)
    expect(overview.shops).toHaveLength(1)
    expect(overview.shops[0]).toMatchObject({
      id: shop.id,
      name: 'Black Tost',
      interactions: 2,
    })
    expect(overview.shops[0]!.totals.PAGE_VIEW).toBe(2)
    expect(overview.paths.map((row) => row.label)).toEqual(['/black-tost', '/'])
    expect(overview.daily.at(-1)).toMatchObject({ views: 3, interactions: 2 })
    expect(overview.daily).toHaveLength(7)
  })

  it('aralık dışındaki olayları saymaz', async () => {
    const now = new Date('2026-09-07T12:00:00.000Z')
    await recordEvent({ type: 'view', path: '/' }, headers(), { ...OPTIONS, now })
    await recordEvent({ type: 'view', path: '/' }, headers(), {
      ...OPTIONS,
      now: new Date('2026-08-01T12:00:00.000Z'),
    })

    const overview = await getAnalyticsOverview(buildRange(now, 7))
    expect(overview.totals.PAGE_VIEW).toBe(1)
  })

  it('hiç olay yoksa boş raporlar', async () => {
    const overview = await getAnalyticsOverview(buildRange(new Date(), 30))
    expect(overview.isEmpty).toBe(true)
    expect(overview.shops).toEqual([])
    expect(overview.visitors).toBe(0)
  })
})

describe('saklama süresi', () => {
  it('süresi geçen olayları siler, yenilerine dokunmaz', async () => {
    const now = new Date('2026-09-07T12:00:00.000Z')
    await recordEvent({ type: 'view', path: '/' }, headers(), { ...OPTIONS, now })
    await recordEvent({ type: 'view', path: '/' }, headers(), {
      ...OPTIONS,
      now: new Date('2024-01-01T12:00:00.000Z'),
    })

    const report = await pruneAnalyticsEvents({ days: 400, now })

    expect(report.deleted).toBe(1)
    expect(await db.analyticsEvent.count()).toBe(1)
  })
})
