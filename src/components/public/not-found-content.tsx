import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

export function NotFoundContent() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-16 sm:px-6 sm:py-24">
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
