import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'
import { getSiteLogoUrl, getSiteSettings } from '@/features/settings/queries'

export const revalidate = 3600

// Yalnızca marka ve başlıklar: tek ağırlık, panelin yüküne girmez. Türkçeye göre kırpılmış dosya.
const display = localFont({
  src: '../../fonts/barlow-condensed-700-tr.woff2',
  variable: '--font-barlow-condensed',
  weight: '700',
})

/**
 * Panelden logo yüklendiyse sekme simgesi o olur. Supabase adresi CSP'nin img-src'sine takılmasın
 * diye görsel kendi alanımızdaki görsel servisinden (64 px) geçer; logo yoksa favicon.ico kalır.
 */
export async function generateMetadata(): Promise<Metadata> {
  const logoUrl = await getSiteLogoUrl()
  if (!logoUrl) return {}
  const icon = `/_next/image?url=${encodeURIComponent(logoUrl)}&w=64&q=75`
  return { icons: { icon, apple: icon } }
}

export default async function PublicLayout({ children }: LayoutProps<'/'>) {
  const [settings, logoUrl] = await Promise.all([getSiteSettings(), getSiteLogoUrl()])
  return (
    <div
      className={`${display.variable} public-theme flex min-h-full flex-1 flex-col bg-background text-foreground`}
    >
      <SiteHeader
        brandName={settings.brandName}
        logoUrl={logoUrl}
        contact={{ phone: settings.contactPhone, instagramUrl: settings.instagramUrl }}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  )
}
