import type { PriceCategoryView } from './view'

/**
 * Oyun vitrini: oyun dükkanlarında (PlayStation, Espor) fiyatsız ve kapaklı kalemlerden oluşan kategori
 * fiyat listesinde satır satır değil, afiş kartları olarak gösterilir. Veritabanında ayrı bir tablo yoktur;
 * panelde "Oyunlar" kategorisine oyun adı, açıklama ("Spor / Futbol · 1-4 Oyuncu") ve kapak girilir.
 * Kapağı hiç olmayan liste eskisi gibi satır kalır: yarım vitrin boş kutularla dolmasın.
 */
export function isGameShelf(category: PriceCategoryView): boolean {
  return (
    category.items.length > 0 &&
    category.items.every((item) => item.price === null) &&
    category.items.some((item) => item.image !== null)
  )
}

export interface GameMeta {
  /** "Spor / Futbol" gibi tür satırı; açıklama boşsa null. */
  genre: string | null
  /** "1-4 Oyuncu"; açıklamada oyuncu bilgisi yoksa null. */
  players: string | null
}

const SEPARATOR = /\s*[·|]\s*/
const PLAYERS = /oyuncu/i

/** "Spor / Futbol · 1-4 Oyuncu" → tür ve oyuncu. Sıra önemsiz, oyuncu kısmı "oyuncu" kelimesinden tanınır. */
export function readGameMeta(description: string | null): GameMeta {
  const parts = (description ?? '')
    .split(SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  const players = parts.find((part) => PLAYERS.test(part)) ?? null
  const genre = parts.filter((part) => part !== players).join(' · ')
  return { genre: genre.length > 0 ? genre : null, players }
}
