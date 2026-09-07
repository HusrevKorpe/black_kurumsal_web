import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { publicEnv } from '@/lib/env'
import './globals.css'

// Türkçe karakterler (ş, ğ, ı, İ) latin-ext alt kümesindedir. Geist Mono yalnızca panelde yüklenir
// (admin/(panel)/layout.tsx): açık sayfalar her ziyarette 2 yazı tipi dosyası daha az indirir.
const geistSans = Geist({ variable: '--font-sans', subsets: ['latin', 'latin-ext'] })

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
