import { splitDisplayName } from '@/lib/utils/display-case'

/**
 * Versal yazılan dükkan, mekan ve kategori adı. Yabancı marka kelimeleri `lang="en"` alır ki
 * CSS büyük harfi "PlayStation"ı "PLAYSTATİON" yapmasın. Bkz. `display-case.ts`.
 */
export function DisplayName({ children }: { children: string }) {
  return (
    <>
      {splitDisplayName(children).map((part, index) =>
        part.foreign ? (
          <span key={index} lang="en">
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </>
  )
}
