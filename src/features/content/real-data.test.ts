import { describe, expect, it } from 'vitest'
import { dayHoursSchema } from '@/features/hours/schema'
import { priceCategorySchema, priceItemSchema } from '@/features/pricing/schema'
import { REAL_SHOP_CONTENT, REAL_SHOP_SLUGS } from './real-data'
import { SKELETON_SHOPS } from './skeleton-data'

const entries = Object.entries(REAL_SHOP_CONTENT)
const categories = entries.flatMap(([slug, content]) =>
  (content.priceCategories ?? []).map((category) => ({ slug, category })),
)

describe('gerçek içerik verisi', () => {
  it('yalnızca iskelette olan dükkanları kapsar', () => {
    const known = new Set<string>(SKELETON_SHOPS.map((shop) => shop.slug))
    for (const slug of REAL_SHOP_SLUGS) expect(known.has(slug)).toBe(true)
  })

  it('her dükkan bilginin nereden geldiğini yazar (uydurma veriden ayırt etmek için)', () => {
    for (const [, content] of entries) expect(content.source.trim().length).toBeGreaterThan(10)
  })

  it('panelin fiyat doğrulamasından geçer (veritabanına yazıldığı biçimde)', () => {
    const categoryShape = priceCategorySchema.pick({ name: true, description: true })
    const itemShape = priceItemSchema.pick({
      name: true,
      description: true,
      price: true,
      unit: true,
    })
    for (const { category } of categories) {
      const written = { name: category.name, description: category.description ?? null }
      expect(categoryShape.safeParse(written).success, category.name).toBe(true)
      for (const item of category.items) {
        const row = {
          name: item.name,
          description: item.description ?? null,
          price: item.price,
          unit: item.unit ?? null,
        }
        expect(itemShape.safeParse(row).success, item.name).toBe(true)
      }
    }
  })

  it('fiyatlar pozitif tam sayıdır, kategori boş kalmaz', () => {
    for (const { category } of categories) {
      expect(category.items.length).toBeGreaterThan(0)
      for (const item of category.items) {
        if (item.price === null) continue
        expect(Number.isInteger(item.price)).toBe(true)
        expect(item.price).toBeGreaterThan(0)
      }
    }
  })

  it('aynı dükkanda kategori adları, aynı kategoride ürün adları benzersizdir', () => {
    for (const [slug, content] of entries) {
      const names = (content.priceCategories ?? []).map((category) => category.name)
      expect(new Set(names).size, slug).toBe(names.length)
      for (const category of content.priceCategories ?? []) {
        const items = category.items.map((item) => item.name)
        expect(new Set(items).size, `${slug}/${category.name}`).toBe(items.length)
      }
    }
  })

  it('çalışma saatleri SS:DD biçimindedir', () => {
    for (const [, content] of entries) {
      if (!content.hours) continue
      const parsed = dayHoursSchema.safeParse({
        dayOfWeek: 1,
        isClosed: false,
        opensAt: content.hours.opensAt,
        closesAt: content.hours.closesAt,
      })
      expect(parsed.success).toBe(true)
    }
  })
})
