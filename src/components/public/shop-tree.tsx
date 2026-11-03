import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { resolveExceptions, resolveHours, toExceptionEntries } from '@/features/hours'
import type { ShopCardData } from '@/features/shops/queries'
import { buildShopTree } from '@/features/shops/tree'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { tr } from '@/lib/i18n/tr'
import { OpenStatusBadge } from './open-status-badge'
import { ShopTreeAtlas } from './shop-tree-atlas'
import { ShopTreeBranches } from './shop-tree-branches'

interface ShopTreeProps {
  brandName: string
  title: string
  subtitle: string | null
  shops: readonly ShopCardData[]
}

/**
 * Açılış: markanın soy ağacı. Kökte marka, dallarda mekan/bölgeler, uçlarda dükkanlar; her uç tek
 * dokunuşla dükkana gider. Ağaç düz HTML listesidir; dalları `ShopTreeBranches` düğümleri ölçüp
 * çizer ve açılışta kökten büyütür. Dallar olmasa da liste kendi başına anlaşılır.
 * `data-tree-node` / `data-tree-parent` dalların neyi neye bağlayacağını söyler.
 */
export function ShopTree({ brandName, title, subtitle, shops }: ShopTreeProps) {
  const nodes = buildShopTree(shops)
  // Dallar geç gelirse dükkanların CSS'te kendiliğinden açılma sırası (liste sırası).
  let row = 0

  return (
    <section
      id="dukkanlar"
      className="tree-section relative isolate scroll-mt-16 overflow-hidden"
      aria-labelledby="acilis-baslik"
    >
      <ShopTreeAtlas />
      <div className="relative isolate mx-auto w-full max-w-6xl px-4 pt-8 pb-12 sm:px-6 lg:pt-16 lg:pb-20">
        <ShopTreeBranches />
        <div className="tree-root" data-tree-node="root">
          <p className="tree-root-name font-display font-bold uppercase" aria-hidden>
            {brandName}
          </p>
          <h1 id="acilis-baslik" className="mt-1 text-base font-medium text-balance lg:text-xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground lg:text-base">{subtitle}</p>
          ) : null}
        </div>

        <ul className="tree" style={{ '--tree-cols': nodes.length } as React.CSSProperties}>
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

  return (
    <Link
      href={ROUTES.shop(shop.slug)}
      data-track="shop"
      data-tree-node={shop.id}
      data-tree-parent={parent}
      className="tree-shop flex min-h-16 items-center gap-3 border border-border bg-card px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-ring active:bg-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base leading-tight font-semibold">{shop.name}</span>
        <span className="mt-0.5 flex items-center gap-x-2 text-sm text-muted-foreground">
          <OpenStatusBadge week={week} exceptions={exceptions} className="shrink-0 text-xs" />
          <span className="min-w-0 truncate">{SHOP_TYPE_META[shop.type].label}</span>
        </span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}
