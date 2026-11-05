import Image from 'next/image'
import { readGameMeta } from '@/features/pricing/games'
import type { PriceCategoryView, PriceItemView } from '@/features/pricing/view'
import { mediaPublicUrl } from '@/lib/media/url'
import { cn } from '@/lib/utils'

interface GameShelfProps {
  category: PriceCategoryView
  /** Kartın köşesindeki platform etiketi: "PS5", "PC". */
  platform: string
}

/**
 * Afiş kartı. Kapakların çoğu oyunun logosunu altta taşır; başlık aynı yere yazıldığı için alt yarı
 * koyu bir perdeyle örtülür, logo ile başlık üst üste binip okunmaz hale gelmesin. Satış ya da "oyna"
 * düğmesi yok: vitrin tanıtım içindir.
 */
function GameCard({
  item,
  index,
  platform,
}: {
  item: PriceItemView
  index: number
  platform: string
}) {
  const { genre, players } = readGameMeta(item.description)
  return (
    <li
      className={cn(
        // Fareyle üstüne gelince hafifçe öne çıkar. Tailwind 4'te hover: yalnız fareli cihazda
        // çalışır, telefonda dokunuşta takılı kalmaz; hareket azaltmayı seçene büyüme anlık olur.
        'relative aspect-[2/3] w-[68vw] max-w-72 shrink-0 snap-start overflow-hidden border border-border/60 bg-card transition-transform duration-300 ease-out hover:z-10 hover:scale-[1.04] motion-reduce:transition-none sm:w-auto sm:max-w-none',
        !item.isAvailable && 'opacity-60',
      )}
    >
      {item.image ? (
        <Image
          src={mediaPublicUrl(item.image)}
          alt={item.image.alt ?? item.name}
          fill
          sizes="(min-width: 1024px) 270px, (min-width: 640px) 33vw, 68vw"
          className="object-cover"
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/90 to-transparent"
      />
      <span
        aria-hidden
        className="absolute top-3 left-3 font-mono text-xs font-semibold text-white/70 tabular-nums"
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="absolute top-3 right-3 bg-black/70 px-2 py-1 text-[11px] font-bold tracking-wider text-white">
        {platform}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4">
        {genre ? (
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-white/75 uppercase">
            <span aria-hidden className="h-0.5 w-5 bg-brand" />
            {genre}
          </p>
        ) : null}
        {/* Oyun adları İngilizce: Türkçe büyük harf "Split"i "SPLİT" yapar. */}
        <h3
          lang="en"
          className="mt-1.5 font-display text-3xl leading-none font-bold text-white uppercase"
        >
          {item.name}
        </h3>
        {players ? (
          <p className="mt-3 border-t border-white/15 pt-2.5 text-xs text-white/70">{players}</p>
        ) : null}
      </div>
    </li>
  )
}

/** Telefonda yana kaydırılan şerit, geniş ekranda ızgara. */
export function GameShelf({ category, platform }: GameShelfProps) {
  return (
    <div>
      {category.description ? (
        <p className="mb-4 text-sm text-muted-foreground">{category.description}</p>
      ) : null}
      {/* Kartlarda düğme yok; kayan şeridin kendisi odaklanmazsa klavyeyle kaydırılamaz. */}
      <ul
        aria-label={category.name}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-brand sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4"
      >
        {category.items.map((item, index) => (
          <GameCard key={item.id} item={item} index={index} platform={platform} />
        ))}
      </ul>
    </div>
  )
}
