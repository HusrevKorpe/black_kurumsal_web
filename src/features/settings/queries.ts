import 'server-only'
import { cache } from 'react'
import type { SiteSettings } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { mediaPublicUrl } from '@/lib/media/url'

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

/** Panelden yüklenen logonun açık URL'i; logo yoksa ya da görsel silinmişse null. */
export const getSiteLogoUrl = cache(async (): Promise<string | null> => {
  const { logoImageId } = await getSiteSettings()
  if (!logoImageId) return null
  const media = await db.media.findUnique({
    where: { id: logoImageId },
    select: { bucket: true, path: true },
  })
  return media ? mediaPublicUrl(media) : null
})
