import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321')
/** Yerel Supabase (127.0.0.1) yalnızca geliştirmede; canlıda *.supabase.co olduğundan SSRF koruması açık kalır. */
const isLocalSupabase = ['127.0.0.1', 'localhost', '::1'].includes(supabaseUrl.hostname)

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    // Tailwind CSS'i HTML'e gömer: ilk ziyarette (aramadan gelen müşteri, mobil, yavaş ağ)
    // render'ı engelleyen ayrı CSS isteği kalkar. Site küçük, CSS ~16 KB; takas belgelenmiş.
    inlineCss: true,
  },
  compiler: {
    // Sentry'nin ağaç budama bayrakları. Yalnızca hata izleme istenir: hata ayıklama, performans
    // izleme (tracing) ve oturum kaydı (replay) kodu istemci paketinden çıkar. withSentryConfig'in
    // bundleSizeOptimizations seçeneği yalnızca webpack'te çalışır; Turbopack için define gerekir.
    define: {
      __SENTRY_DEBUG__: false,
      __SENTRY_TRACING__: false,
      __RRWEB_EXCLUDE_IFRAME__: true,
      __RRWEB_EXCLUDE_SHADOW_DOM__: true,
      __SENTRY_EXCLUDE_REPLAY_WORKER__: true,
    },
  },
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg', 'sharp'],
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowLocalIP: isLocalSupabase,
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

/** Kaynak haritaları yalnızca yetki anahtarı varsa (Vercel/CI) yüklenir; yerel build'e dokunmaz. */
const uploadsSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN)

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !uploadsSourceMaps },
  silent: !uploadsSourceMaps,
  telemetry: false,
  widenClientFileUpload: true,
  // Reklam engelleyiciler Sentry alan adını keser; olaylar kendi alan adımızdan tünellenir.
  tunnelRoute: '/monitoring',
})
