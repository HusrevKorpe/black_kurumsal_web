import type { MetadataRoute } from 'next'
import { publicLocationWhere } from '@/features/locations/queries'
import { publicShopWhere } from '@/features/shops/queries'
import { db } from '@/lib/db'
import { publicEnv } from '@/lib/env'
import { ROUTES } from '@/lib/constants/routes'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL
  const [shops, locations] = await Promise.all([
    db.shop.findMany({ where: publicShopWhere, select: { slug: true, updatedAt: true } }),
    db.location.findMany({ where: publicLocationWhere, select: { slug: true, updatedAt: true } }),
  ])

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}${ROUTES.campaigns}`, changeFrequency: 'daily', priority: 0.8 },
    ...locations.map((l) => ({
      url: `${base}${ROUTES.location(l.slug)}`,
      lastModified: l.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...shops.map((s) => ({
      url: `${base}${ROUTES.shop(s.slug)}`,
      lastModified: s.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ]
}
