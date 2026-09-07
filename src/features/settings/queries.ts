import 'server-only'
import { cache } from 'react'
import type { SiteSettings } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  brandName: 'Black',
  heroTitle: 'Black',
  heroSubtitle: null,
  aboutText: null,
  contactPhone: null,
  contactEmail: null,
  instagramUrl: null,
  facebookUrl: null,
  logoImageId: null,
  updatedAt: new Date(0),
}

/** Tek satırlık ayarlar; kayıt yoksa varsayılanlar (site asla boş kalmaz). */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const settings = await db.siteSettings.findUnique({ where: { id: 1 } })
  return settings ?? DEFAULT_SETTINGS
})
