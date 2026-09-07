import Link from 'next/link'
import { RANGE_OPTIONS, type RangeDays } from '@/features/analytics/range'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

interface RangeTabsProps {
  active: RangeDays
  sort: string
}

/** Aralık seçimi bağlantılarla yapılır: sayfa sunucuda üretilir, istemciye JS gitmez. */
export function RangeTabs({ active, sort }: RangeTabsProps) {
  return (
    <nav aria-label="Zaman aralığı" className="flex gap-1 rounded-lg border bg-card p-1">
      {RANGE_OPTIONS.map((days) => (
        <Link
          key={days}
          href={`${ROUTES.admin.analytics}?gun=${days}&sirala=${sort}`}
          aria-current={days === active ? 'true' : undefined}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            days === active
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tr.admin.analytics.daysLabel(days)}
        </Link>
      ))}
    </nav>
  )
}
