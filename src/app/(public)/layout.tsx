import localFont from 'next/font/local'
import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'
import { getSiteSettings } from '@/features/settings/queries'

export const revalidate = 3600

// Yalnızca marka ve başlıklar: tek ağırlık, panelin yüküne girmez. Türkçeye göre kırpılmış dosya.
const display = localFont({
  src: '../../fonts/barlow-condensed-700-tr.woff2',
  variable: '--font-barlow-condensed',
  weight: '700',
})

export default async function PublicLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSiteSettings()
  return (
    <div
      className={`${display.variable} public-theme flex min-h-full flex-1 flex-col bg-background text-foreground`}
    >
      <SiteHeader
        brandName={settings.brandName}
        contact={{ phone: settings.contactPhone, instagramUrl: settings.instagramUrl }}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  )
}
