/**
 * Versal başlıklarda yabancı marka adları. Sayfa `lang="tr"` olduğu için CSS büyük harfi "i"yi
 * "İ" yapar; Türkçe ad için doğru ("Tost Evi" → "TOST EVİ"), ama "PlayStation" → "PLAYSTATİON"
 * olur. Böyle kelimeler `lang="en"` ile ayrı basılır, gerisi Türkçe kalır.
 */

/** Ortasında büyük harf olan (PlayStation, iPhone) ya da bilinen İngilizce kelimeler. */
const FOREIGN_WORDS = new Set([
  'playstation',
  'gaming',
  'gamer',
  'premium',
  'vip',
  'billiard',
  'billiards',
  'cinema',
  'fifa',
])

export interface DisplayPart {
  text: string
  foreign: boolean
}

function isForeignWord(word: string): boolean {
  const letters = word.replace(/[^\p{L}]/gu, '')
  if (!letters) return false
  if (/\p{Ll}\p{Lu}/u.test(letters)) return true
  return FOREIGN_WORDS.has(letters.toLocaleLowerCase('en'))
}

/** Metni boşlukları koruyarak Türkçe ve yabancı parçalara böler; komşu aynı türler birleşir. */
export function splitDisplayName(text: string): DisplayPart[] {
  const parts: DisplayPart[] = []
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue
    const last = parts.at(-1)
    // Boşluk kendi başına bir tür değildir: önceki parçaya eklenir.
    const foreign = /^\s+$/.test(token) ? (last?.foreign ?? false) : isForeignWord(token)
    if (last && last.foreign === foreign) last.text += token
    else parts.push({ text: token, foreign })
  }
  return parts
}
