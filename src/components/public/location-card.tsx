import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
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
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:aspect-[3/2]"
    >
      <CoverImage
        media={location.coverImage}
        alt={location.name}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent"
        aria-hidden
      />
      <div className="relative flex items-end justify-between gap-3 p-4">
        <div>
          <Badge variant={isVenue ? 'default' : 'outline'} className="mb-2">
            {isVenue ? tr.location.venue : tr.location.district}
          </Badge>
          <h3 className="text-xl font-semibold">{location.name}</h3>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">
          {tr.home.shopCount(location._count.shops)}
        </span>
      </div>
    </Link>
  )
}
