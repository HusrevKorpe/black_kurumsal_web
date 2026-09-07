import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

interface HeroProps {
  title: string
  subtitle: string | null
}

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-brand/25 via-transparent to-transparent"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{subtitle}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={ROUTES.homeSection('dukkanlar')} className={buttonVariants({ size: 'lg' })}>
            {tr.nav.shops}
          </Link>
          <Link
            href={ROUTES.campaigns}
            className={buttonVariants({ size: 'lg', variant: 'outline' })}
          >
            {tr.nav.campaigns}
          </Link>
        </div>
      </div>
    </section>
  )
}
