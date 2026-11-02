import type { ShopCardData } from '@/features/shops/queries'
import { ShopRow } from './shop-row'

interface ShopDirectoryProps {
  shops: readonly ShopCardData[]
  hideLocation?: boolean
}

/** Tabela listesi. Yan pano üzerine gelinen dükkanı CSS ile gösterir; JS gerekmez. */
export function ShopDirectory({ shops, hideLocation }: ShopDirectoryProps) {
  return (
    <ul className="shop-directory">
      {shops.map((shop) => (
        <ShopRow key={shop.id} shop={shop} hideLocation={hideLocation} />
      ))}
    </ul>
  )
}
