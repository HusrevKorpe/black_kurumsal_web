import { ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { resolveExceptions, resolveHours, toExceptionEntries } from '@/features/hours'
import type { LocationCardData } from '@/features/locations/queries'
import type { ShopCardData } from '@/features/shops/queries'
import { buildShopTree } from '@/features/shops/tree'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { HeroWordmark } from './hero-wordmark'
import { OpenStatusBadge } from './open-status-badge'
import { ShopCoverMorph, ShopNameMorph } from './shop-morph'
import { ShopTypeIcon } from './shop-type-icon'
import { ShopTreeAtlas } from './shop-tree-atlas'
import { ShopTreeBranches } from './shop-tree-branches'

interface ShopTreeProps {
  brandName: string
  title: string
  subtitle: string | null
  shops: readonly ShopCardData[]
  /** Mekan/bölgeler: sırası ağaçtaki dal sırasıdır. Mekan (Black Garden) tek uç olarak çizilir. */
  locations: readonly LocationCardData[]
}

/**
 * Açılış: markanın soy ağacı. Kökte marka, dallarda mekan/bölgeler, uçlarda dükkanlar; her uç tek
 * dokunuşla dükkana gider. Ağaç düz HTML listesidir; dalları `ShopTreeBranches` düğümleri ölçüp
 * çizer ve açılışta kökten büyütür. Dallar olmasa da liste kendi başına anlaşılır.
 * `data-tree-node` / `data-tree-parent` dalların neyi neye bağlayacağını söyler.
 */
export function ShopTree({ brandName, title, subtitle, shops, locations }: ShopTreeProps) {
  const nodes = buildShopTree(shops, locations)
  // Dallar geç gelirse dükkanların CSS'te kendiliğinden açılma sırası (liste sırası).
  let row = 0

  return (
    <section
      id="dukkanlar"
      className="tree-section relative isolate scroll-mt-16 overflow-hidden"
      aria-labelledby="acilis-baslik"
    >
      <ShopTreeAtlas />
      <div className="relative isolate mx-auto w-full max-w-7xl px-4 pt-8 pb-12 sm:px-6 lg:pt-16 lg:pb-20">
        <ShopTreeBranches />
        <div className="tree-root" data-tree-node="root">
          <HeroWordmark name={brandName} />
          <h1 id="acilis-baslik" className="mt-1 text-base font-medium text-balance lg:text-xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground lg:text-base">{subtitle}</p>
          ) : null}
        </div>

        <ul
          className="tree"
          style={{ '--tree-template': treeTemplate(nodes) } as React.CSSProperties}
        >
          {nodes.map((node) =>
            node.kind === 'group' ? (
              <li key={node.key} className="tree-branch" style={openAt(row++)}>
                <Link
                  href={ROUTES.location(node.location.slug)}
                  data-tree-node={node.key}
                  data-tree-parent="root"
                  className="tree-group flex min-h-12 flex-col justify-center focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="font-display text-xl leading-none font-bold uppercase">
                    {node.location.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {node.location.kind === 'VENUE' ? tr.location.venue : tr.location.district}
                  </span>
                </Link>
                <ul className="tree-twigs">
                  {node.shops.map((shop) => (
                    <li key={shop.id} className="tree-leaf" style={openAt(row++)}>
                      <TreeShop shop={shop} parent={node.key} />
                    </li>
                  ))}
                </ul>
              </li>
            ) : node.kind === 'venue' ? (
              <li key={node.key} className="tree-branch tree-leaf" style={openAt(row++)}>
                <TreeVenue venue={node.location} shopCount={node.shopCount} />
              </li>
            ) : (
              <li key={node.key} className="tree-branch tree-leaf" style={openAt(row++)}>
                <TreeShop shop={node.shop} parent="root" />
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  )
}

/**
 * Masaüstü sütunları: dükkanları altında sıralanan dallar (Çarşı, Iyaş) tek kutuluk uçlardan
 * geniştir; yoksa dört sütunda dükkan adları sıkışır.
 */
function treeTemplate(nodes: readonly { kind: string }[]): string {
  return nodes.map((n) => (n.kind === 'group' ? 'minmax(0, 1.5fr)' : 'minmax(0, 1fr)')).join(' ')
}

/** Yedek açılış sırası (globals.css `--open`). */
function openAt(step: number) {
  return { '--open': step } as React.CSSProperties
}

function TreeShop({ shop, parent }: { shop: ShopCardData; parent: string }) {
  const { week, source } = resolveHours(shop.hours, shop.location?.hours)
  const exceptions = resolveExceptions(
    source,
    toExceptionEntries(shop.hoursExceptions),
    shop.location ? toExceptionEntries(shop.location.hoursExceptions) : null,
  )
  const meta = SHOP_TYPE_META[shop.type]

  return (
    <Link
      href={ROUTES.shop(shop.slug)}
      data-track="shop"
      data-tree-node={shop.id}
      data-tree-parent={parent}
      data-accent={meta.accent}
      className="tree-shop flex min-h-16 items-center gap-3 border border-border bg-card py-2 pr-3 pl-2 transition-colors focus-visible:outline-2 focus-visible:outline-ring active:bg-accent"
    >
      {/* Kapağın küçüğü: dokununca büyüyüp dükkan sayfasının kapağı olur (`ShopCoverMorph`). */}
      <ShopCoverMorph slug={shop.slug}>
        <span className="tree-shop-thumb relative size-12 shrink-0 overflow-hidden" aria-hidden>
          {shop.coverImage ? (
            <Image
              src={mediaPublicUrl(shop.coverImage)}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-brand">
              <ShopTypeIcon type={shop.type} className="size-6" />
            </span>
          )}
        </span>
      </ShopCoverMorph>
      <span className="min-w-0 flex-1">
        <ShopNameMorph slug={shop.slug}>
          {/* Dar sütunda (masaüstünde 4 dal) ad kesilmesin: iki satıra iner. */}
          <span className="line-clamp-2 block w-fit max-w-full text-base leading-tight font-semibold">
            {shop.name}
          </span>
        </ShopNameMorph>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <OpenStatusBadge week={week} exceptions={exceptions} className="shrink-0 text-xs" />
          <span className="min-w-0 truncate">{meta.label}</span>
        </span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}

/**
 * Mekan ucu (Black Garden): dükkan kutusuyla aynı görünür, dokununca mekan sayfası açılır;
 * içindeki dükkanlar orada listelenir.
 */
function TreeVenue({ venue, shopCount }: { venue: LocationCardData; shopCount: number }) {
  return (
    <Link
      href={ROUTES.location(venue.slug)}
      data-track="location"
      data-tree-node={venue.id}
      data-tree-parent="root"
      data-accent="amber"
      className="tree-shop flex min-h-16 items-center gap-3 border border-border bg-card py-2 pr-3 pl-2 transition-colors focus-visible:outline-2 focus-visible:outline-ring active:bg-accent"
    >
      <span className="tree-shop-thumb relative size-12 shrink-0 overflow-hidden" aria-hidden>
        {venue.coverImage ? (
          <Image
            src={mediaPublicUrl(venue.coverImage)}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-brand">
            <ShopTypeIcon type="FOOD" className="size-6" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block w-fit max-w-full text-base leading-tight font-semibold">
          {venue.name}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {shopCount > 0 ? `${tr.location.venue} · ${shopCount} dükkan` : tr.location.venue}
        </span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}
