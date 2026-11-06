import { DisplayName } from '../display-name'

/** "Black PlayStation Çarşı" → ["Black", "PlayStation Çarşı"]; tek kelimede ikinci parça yok. */
export function splitTitle(name: string): { first: string; rest: string | null } {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  const space = trimmed.indexOf(' ')
  if (space === -1) return { first: trimmed, rest: null }
  return { first: trimmed.slice(0, space), rest: trimmed.slice(space + 1) }
}

/** En uzun kelimenin harf sayısı: başlık boyu buna göre küçülür, kelime satıra sığar. */
export function longestWordLength(name: string): number {
  return Math.max(1, ...name.split(/\s+/).map((word) => [...word].length))
}

/**
 * Pafta'nın dev adı: ilk kelime mürekkep, kalanı alt satırda dükkanın tabela renginde.
 * Boyu sütuna göre `.pafta-title` hesaplar (pafta.css).
 */
export function PaftaTitle({ name }: { name: string }) {
  const { first, rest } = splitTitle(name)
  return (
    <span
      className="pafta-title block"
      style={{ '--pafta-longest': longestWordLength(name) } as React.CSSProperties}
    >
      <DisplayName>{first}</DisplayName>
      {rest ? (
        <>
          {/* Ekran okuyucu "BlackGarden" diye bitişik okumasın. */}{' '}
          <span className="pafta-title-rest">
            <DisplayName>{rest}</DisplayName>
          </span>
        </>
      ) : null}
    </span>
  )
}
