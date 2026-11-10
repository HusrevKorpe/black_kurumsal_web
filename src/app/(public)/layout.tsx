import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'
import { getSiteLogoUrl, getSiteSettings } from '@/features/settings/queries'
import { getNavShopGroups } from '@/features/shops/nav'
import { tr } from '@/lib/i18n/tr'

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
  const [settings, logoUrl, shopGroups] = await Promise.all([
    getSiteSettings(),
    getSiteLogoUrl(),
    getNavShopGroups(),
  ])
  return (
    <div
      className={`${display.variable} public-theme flex min-h-full flex-1 flex-col bg-background text-foreground`}
    >
      {/* Klavyeyle gezen ilk Tab'da bunu görür; üst menüyü atlayıp doğrudan içeriğe iner. */}
      <a
        href="#icerik"
        className="fixed top-2 left-2 z-[100] -translate-y-24 bg-brand px-4 py-3 font-semibold text-brand-foreground focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {tr.nav.skipToContent}
      </a>
      <SiteHeader
        brandName={settings.brandName}
        logoUrl={logoUrl}
        contact={{ phone: settings.contactPhone, instagramUrl: settings.instagramUrl }}
        shopGroups={shopGroups}
      />
      <main id="icerik" tabIndex={-1} className="flex-1 scroll-mt-16 outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  )
}
