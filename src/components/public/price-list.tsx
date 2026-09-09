import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { PriceCategoryView, PriceItemView } from '@/features/pricing/view'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { cn } from '@/lib/utils'
import { formatPriceWithUnit } from '@/lib/utils/format'

interface PriceListProps {
  categories: PriceCategoryView[]
}

function PriceRow({ item }: { item: PriceItemView }) {
  return (
    <li className={cn('flex items-start gap-3 py-3', !item.isAvailable && 'opacity-60')}>
      {item.image ? (
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
          <Image
            src={mediaPublicUrl(item.image)}
            alt={item.image.alt ?? item.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('font-medium', !item.isAvailable && 'line-through')}>
            {item.name}
          </span>
          {item.isFeatured ? (
            <Badge className="gap-1 px-1.5 py-0 text-[11px]">
              <StarIcon className="size-3" /> {tr.shop.featured}
            </Badge>
          ) : null}
          {!item.isAvailable ? (
            <Badge variant="outline" className="px-1.5 py-0 text-[11px]">
              {tr.shop.unavailable}
            </Badge>
          ) : null}
        </div>
        {item.description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
      {item.price !== null ? (
        <span className="shrink-0 font-semibold tabular-nums">
          {formatPriceWithUnit(item.price, item.unit)}
        </span>
      ) : null}
    </li>
  )
}

export function PriceList({ categories }: PriceListProps) {
  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">{tr.shop.noPrices}</p>
  }
  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category.id} aria-labelledby={`fiyat-${category.id}`}>
          {/* Kategori başlığı kalem adlarına karışmasın: marka rengi, versal ve ayırıcı çizgi. */}
          <div className="flex items-center gap-3">
            <h3
              id={`fiyat-${category.id}`}
              className="text-base font-bold tracking-wide text-brand uppercase"
            >
              {category.name}
            </h3>
            <span aria-hidden className="h-px flex-1 bg-brand/30" />
          </div>
          {category.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
          ) : null}
          <ul className="mt-1 divide-y divide-border/60">
            {category.items.map((item) => (
              <PriceRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
