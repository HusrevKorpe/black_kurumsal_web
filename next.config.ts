import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321')
/** Yerel Supabase (127.0.0.1) yalnızca geliştirmede; canlıda *.supabase.co olduğundan SSRF koruması açık kalır. */
const isLocalSupabase = ['127.0.0.1', 'localhost', '::1'].includes(supabaseUrl.hostname)
const isDev = process.env.NODE_ENV === 'development'

/**
 * İçerik Güvenlik Politikası. Nonce ile kurulmadı: nonce her isteği dinamik render'a zorlar,
 * bu da açık sayfaların ISR/CDN önbelleğini bitirirdi (Next belgesi bunu açıkça yazıyor:
 * `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` → "Static optimization
 * and ISR are disabled"). Site kullanıcı HTML'i basmıyor; 'unsafe-inline' yalnızca Next'in kendi
 * satır içi betiği, `inlineCss` stil etiketi ve JSON-LD için gerekiyor. Takas bilinçli: asıl kazanç
 * çerçeveleme (frame-ancestors), eklenti (object-src) ve veriyi dışarı kaçıramayan connect-src.
 */
const contentSecurityPolicy = [
  `default-src 'self'`,
  // 'unsafe-eval' yalnızca geliştirmede: React sunucu hata yığınını tarayıcıda eval ile kuruyor.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  // data: → Next'in bulanık yer tutucusu, blob: → panelde yükleme öncesi önizleme.
  `img-src 'self' data: blob:`,
  // next/font yazı tiplerini derlemede kendi alanımıza indiriyor; dışarıya font isteği yok.
  `font-src 'self'`,
  // Tarayıcı doğrudan Supabase'e gidiyor: panele giriş ve imzalı görsel yükleme. ws: geliştirmede HMR.
  `connect-src 'self' ${supabaseUrl.origin}${isDev ? ' ws: wss:' : ''}`,
  // browser-image-compression görseli blob URL'li bir web worker'da küçültüyor.
  `worker-src 'self' blob:`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  // Yerel Supabase http üzerinden konuşuyor (yerel `pnpm start`, e2e); yükseltme yalnızca
  // gerçek https kurulumunda açılır.
  ...(isLocalSupabase ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // frame-ancestors'ın eski tarayıcılardaki karşılığı. Panelin tıklama hırsızlığına karşı ikinci kilidi.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Dış siteye yalnızca alan adımız gider, ziyaret edilen yol gitmez.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Vercel bunu kendisi de ekliyor; açıkça yazıldı ki başka bir sunucuya taşınınca kaybolmasın.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

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
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
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
