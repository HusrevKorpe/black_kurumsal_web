import type { SkeletonShopSlug } from './skeleton-data'

/**
 * Oyun vitrini içeriği (`pnpm content:games`): oyun dükkanlarının "Oyunlar" kategorisine yazılan
 * afiş kartları. Kart düzeni `src/features/pricing/games.ts`'te; burası yalnızca "hangi dükkanda hangi
 * oyun" listesidir. Kapaklar `scripts/assets/games/<slug>.webp` (Steam'deki resmi 600×900 dikey afiş).
 *
 * Patronun isteği (2026-11-04): iki PlayStation dükkanına kart vitrini. Oyun seçimi patron listesini
 * gönderene kadar Claude'un önerisidir; panelden değiştirilebilir. Espor dükkanlarının listesi bekleniyor.
 */
export interface GameEntry {
  /** Kapak dosyasının adı: `scripts/assets/games/<slug>.webp`. */
  slug: string
  name: string
  genre: string
  players: string
}

export const GAMES = {
  'ea-fc-27': { slug: 'ea-fc-27', name: 'FC 27', genre: 'Spor / Futbol', players: '1-4 Oyuncu' },
  efootball: {
    slug: 'efootball',
    name: 'eFootball',
    genre: 'Spor / Futbol',
    players: '1-4 Oyuncu',
  },
  'gta-v': { slug: 'gta-v', name: 'GTA V', genre: 'Aksiyon / Macera', players: '1 Oyuncu' },
  'mortal-kombat-1': {
    slug: 'mortal-kombat-1',
    name: 'Mortal Kombat 1',
    genre: 'Dövüş',
    players: '1-2 Oyuncu',
  },
} as const satisfies Record<string, GameEntry>

export type GameSlug = keyof typeof GAMES

export const GAME_CATEGORY_NAME = 'Oyunlar'
export const GAME_CATEGORY_DESCRIPTION = 'Konsollarımızda yüklü oyunlardan bazıları'

const PLAYSTATION_GAMES: readonly GameSlug[] = ['ea-fc-27', 'gta-v', 'efootball', 'mortal-kombat-1']

/** Sıra kart sırasıdır (kartın köşesindeki 01, 02…). */
export const SHOP_GAMES = {
  'black-playstation-carsi': PLAYSTATION_GAMES,
  'black-playstation-iyas': PLAYSTATION_GAMES,
} as const satisfies Partial<Record<SkeletonShopSlug, readonly GameSlug[]>>

export type GameShopSlug = keyof typeof SHOP_GAMES

/** Kartın okuduğu biçim: `readGameMeta` bunu tür ve oyuncu olarak ayırır. */
export function gameDescription(game: GameEntry): string {
  return `${game.genre} · ${game.players}`
}
