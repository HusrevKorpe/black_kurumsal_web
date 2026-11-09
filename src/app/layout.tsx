import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_TITLE_TEMPLATE,
} from '@/lib/constants/site'
import { InlineScript } from '@/components/inline-script'
import { DEFAULT_THEME, THEME_SCRIPT } from '@/lib/browser/theme'
import { publicEnv } from '@/lib/env'
import './globals.css'

// Türkçeye göre kırpılmış tek dosya (src/fonts/README.md): latin + latin-ext iki dosyası yerine.
// Geist Mono yalnızca panelde yüklenir (admin/(panel)/layout.tsx).
const geistSans = localFont({
  src: '../fonts/geist-tr.woff2',
  variable: '--font-sans',
  weight: '400 700',
})

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: { default: SITE_TITLE, template: SITE_TITLE_TEMPLATE },
  description: SITE_DESCRIPTION,
  // Açık site panelden yüklenen logo varsa bunu ezer ((public)/layout.tsx).
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  // Sayfa kendi openGraph'ını verirse bu nesnenin yerine geçer (birleşmez): o sayfalar da
  // fotoğraf yoksa DEFAULT_OG_IMAGE'ı kendisi koyar.
  openGraph: {
    siteName: 'Black',
    locale: 'tr_TR',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: 'summary_large_image' },
}

// theme-color'ı tema betiği kurar ve tercihe göre günceller (src/lib/browser/theme.ts).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // Tema betiği `dark` sınıfını ve color-scheme'i hidrasyondan önce değiştirebilir.
    <html
      lang="tr"
      className={`${geistSans.variable} dark h-full antialiased`}
      style={{ colorScheme: DEFAULT_THEME }}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={THEME_SCRIPT} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
