import Link from 'next/link'
import type { LocationCardData } from '@/features/locations/queries'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { CoverImage } from './cover-image'

interface LocationCardProps {
  location: LocationCardData
}

export function LocationCard({ location }: LocationCardProps) {
  const isVenue = location.kind === 'VENUE'
  return (
    <Link
      href={ROUTES.location(location.slug)}
      data-track="location"
      className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden bg-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <CoverImage
        media={location.coverImage}
        alt={location.name}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
        aria-hidden
      />
      <div className="relative p-4 lg:p-6">
        <h3 className="font-display text-4xl leading-none font-bold uppercase lg:text-6xl">
          {location.name}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isVenue ? tr.location.venue : tr.location.district} ·{' '}
          {tr.home.shopCount(location._count.shops)}
        </p>
      </div>
    </Link>
  )
}
