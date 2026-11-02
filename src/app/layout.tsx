import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
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
  title: { default: 'Black', template: '%s | Black' },
  description: 'Black dükkanları: PlayStation, internet kafe, yeme-içme ve konaklama.',
}

export const viewport: Viewport = {
  themeColor: '#212121',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="tr" className={`${geistSans.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
