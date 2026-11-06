import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { PriceCategoryView, PriceItemView } from '@/features/pricing/view'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { cn } from '@/lib/utils'
import { formatPriceWithUnit } from '@/lib/utils/format'
import { DisplayName } from './display-name'
import { ticketNumber } from './pafta/ticket-number'

interface PriceListProps {
  categories: PriceCategoryView[]
}

function PriceRow({ item }: { item: PriceItemView }) {
  return (
    <li className={cn('flex items-start gap-3 py-3.5', !item.isAvailable && 'opacity-60')}>
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

/** Kategori bu kadarı geçince üstte atlama bağlantıları çıkar: uzun menüde aranan bölüm uzak kalmasın. */
const JUMP_MIN_CATEGORIES = 4

/**
 * Pafta bilet dili: her kategori çerçeveli bir bilet, sağ üstte "01 / 07". Bilet tıklanmaz, sadece
 * okunur; kalem satırları (fotoğraf, açıklama, fiyat/birim, rozetler) eski okunaklı düzeninde kalır.
 * Geniş sütunda biletler iki kolona dağılır.
 */
export function PriceList({ categories }: PriceListProps) {
  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">{tr.shop.noPrices}</p>
  }
  const total = categories.length
  return (
    <div className="grid gap-4">
      {total >= JUMP_MIN_CATEGORIES ? (
        <nav
          aria-label={tr.pafta.menuJump}
          className="-mx-[18px] overflow-x-auto px-[18px] py-0.5 md:mx-0 md:px-0.5"
        >
          <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
            {categories.map((category) => (
              <li key={category.id}>
                <a href={`#fiyat-${category.id}`} className="pafta-jump">
                  <DisplayName>{category.name}</DisplayName>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className={total > 1 ? 'pafta-menu' : undefined}>
        {categories.map((category, index) => (
          <section
            key={category.id}
            aria-labelledby={`fiyat-${category.id}`}
            className="pafta-box scroll-mt-24 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                id={`fiyat-${category.id}`}
                className="scroll-mt-24 font-display text-2xl leading-none font-bold text-brand uppercase"
              >
                <DisplayName>{category.name}</DisplayName>
              </h3>
              <span className="pafta-no pt-1" aria-hidden>
                {ticketNumber(index, total)}
              </span>
            </div>
            {category.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
            ) : null}
            <ul className="mt-1 divide-y divide-border">
              {category.items.map((item) => (
                <PriceRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
