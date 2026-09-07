import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'
import { getSiteSettings } from '@/features/settings/queries'

export const revalidate = 3600

export default async function PublicLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSiteSettings()
  return (
    <>
      <SiteHeader brandName={settings.brandName} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </>
  )
}
