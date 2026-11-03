import {
  BedDoubleIcon,
  Gamepad2Icon,
  type LucideProps,
  SandwichIcon,
  StoreIcon,
} from 'lucide-react'
import type { ShopType } from '@/generated/prisma/enums'
import { categoryOf, type ShopCategory } from '@/lib/constants/shops'

const ICONS: Record<ShopCategory, React.ComponentType<LucideProps>> = {
  ENTERTAINMENT: Gamepad2Icon,
  FOOD: SandwichIcon,
  ACCOMMODATION: BedDoubleIcon,
  OTHER: StoreIcon,
}

/** Fotoğrafı olmayan dükkanın küçük kapağında türünü anlatan simge. */
export function ShopTypeIcon({ type, ...props }: { type: ShopType } & LucideProps) {
  const Icon = ICONS[categoryOf(type)]
  return <Icon aria-hidden {...props} />
}
