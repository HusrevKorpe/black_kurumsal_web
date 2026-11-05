import type { SkeletonShopSlug } from './skeleton-data'

/**
 * Oyun vitrini içeriği (`pnpm content:games`): oyun dükkanlarının "Oyunlar" kategorisine yazılan
 * afiş kartları. Kart düzeni `src/features/pricing/games.ts`'te; burası yalnızca "hangi dükkanda hangi
 * oyun" listesidir. Kapaklar `scripts/assets/games/<slug>.webp` (Steam'deki resmi 600×900 dikey afiş).
 *
 * Patronun isteği (2026-11-04): iki PlayStation dükkanına kart vitrini; PS oyun seçimi Claude'un
 * önerisidir, panelden değiştirilebilir. Espor listesi patronun (2026-11-05): CS2, Valorant, LoL,
 * Minecraft. Steam'de olmayanların kapağı resmi mağazalardan: Valorant/LoL Epic (1200×1600, 2:3'e
 * kırpıldı), Minecraft Microsoft Store "Poster".
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
  'counter-strike-2': {
    slug: 'counter-strike-2',
    name: 'Counter-Strike 2',
    genre: 'FPS / Takım',
    players: '10 Oyuncu (5v5)',
  },
  valorant: {
    slug: 'valorant',
    name: 'Valorant',
    genre: 'FPS / Taktik',
    players: '10 Oyuncu (5v5)',
  },
  'league-of-legends': {
    slug: 'league-of-legends',
    name: 'League of Legends',
    genre: 'MOBA',
    players: '10 Oyuncu (5v5)',
  },
  minecraft: {
    slug: 'minecraft',
    name: 'Minecraft',
    genre: 'Hayatta Kalma / Yapı',
    players: 'Tek ve Çok Oyunculu',
  },
} as const satisfies Record<string, GameEntry>

export type GameSlug = keyof typeof GAMES

export const GAME_CATEGORY_NAME = 'Oyunlar'

const PLAYSTATION_GAMES: readonly GameSlug[] = ['ea-fc-27', 'gta-v', 'efootball', 'mortal-kombat-1']
const ESPOR_GAMES: readonly GameSlug[] = [
  'counter-strike-2',
  'valorant',
  'league-of-legends',
  'minecraft',
]

/** Sıra kart sırasıdır (kartın köşesindeki 01, 02…). */
export const SHOP_GAMES = {
  'black-playstation-carsi': PLAYSTATION_GAMES,
  'black-playstation-iyas': PLAYSTATION_GAMES,
  'black-espor-carsi': ESPOR_GAMES,
  'black-espor-iyas': ESPOR_GAMES,
} as const satisfies Partial<Record<SkeletonShopSlug, readonly GameSlug[]>>

export type GameShopSlug = keyof typeof SHOP_GAMES

/** Kategorinin alt yazısı; espor salonunda konsol değil bilgisayar. */
export function gameCategoryDescription(shop: GameShopSlug): string {
  return shop.startsWith('black-espor-')
    ? 'Bilgisayarlarımızda yüklü oyunlardan bazıları'
    : 'Konsollarımızda yüklü oyunlardan bazıları'
}

/** Kartın okuduğu biçim: `readGameMeta` bunu tür ve oyuncu olarak ayırır. */
export function gameDescription(game: GameEntry): string {
  return `${game.genre} · ${game.players}`
}
