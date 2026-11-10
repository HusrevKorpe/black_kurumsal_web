import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'
import { SITE_TITLE_TEMPLATE } from '@/lib/constants/site'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

/**
 * not-found dosyası metadata dışa aktaramaz; eşleşmeyen adreste sekme başlığı ana sayfanınki kalırdı.
 * React 19 bileşen içindeki <title>'ı head'e taşır.
 */
const NOT_FOUND_TITLE = SITE_TITLE_TEMPLATE.replace('%s', tr.common.notFoundTitle)

export function NotFoundContent() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-16 sm:py-24 md:px-6 lg:px-12">
      <title>{NOT_FOUND_TITLE}</title>
      <p aria-hidden className="font-display text-[9rem] leading-[0.85] font-bold sm:text-[14rem]">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold">{tr.common.notFoundTitle}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{tr.common.notFoundText}</p>
      <Link
        href={ROUTES.home}
        className={cn(buttonVariants({ size: 'lg' }), 'mt-8 h-12 w-fit px-5 text-base')}
      >
        {tr.common.goHome}
      </Link>
    </div>
  )
}
