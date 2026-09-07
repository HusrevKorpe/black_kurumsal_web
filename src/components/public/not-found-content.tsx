import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export function NotFoundContent() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{tr.common.notFoundTitle}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{tr.common.notFoundText}</p>
      <Link href={ROUTES.home} className={`${buttonVariants({ size: 'lg' })} mt-8`}>
        {tr.common.goHome}
      </Link>
    </div>
  )
}
