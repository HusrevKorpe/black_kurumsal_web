import type { MetadataRoute } from 'next'
import { publicEnv } from '@/lib/env'

/**
 * Yalnızca canlı ortam aramaya açılır. Staging (Vercel preview) canlının birebir kopyasını
 * taşıdığından indekslenirse asıl siteyle çift içerik olur ve sıralamayı böler. `VERCEL_ENV`
 * yalnızca Vercel'de tanımlıdır: yerelde ve CI'da robots normal kurallarıyla üretilir.
 */
export function isIndexable(vercelEnv: string | undefined): boolean {
  return !vercelEnv || vercelEnv === 'production'
}

export default function robots(): MetadataRoute.Robots {
  // Kapalı ortamda site haritası da verilmez: tarayıcıya tek bir kapı bırakılmaz.
  if (!isIndexable(process.env.VERCEL_ENV)) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin'] }],
    sitemap: `${publicEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
